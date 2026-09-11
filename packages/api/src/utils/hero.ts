import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { calculateHealthRegenerationEventDuration } from '@pillage-first/game-assets/utils/hero';
import { getItemDefinition } from '@pillage-first/game-assets/utils/items';
import type { ResourceProductionEffectId } from '@pillage-first/types/models/effect';
import {
  type HeroResourceToProduce,
  heroResourceToProduceSchema,
} from '@pillage-first/types/models/hero';
import type { Resource } from '@pillage-first/types/models/resource';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  deleteHeroEffectsQuery,
  updateHeroVillageEffectsByVillageIdQuery,
} from '../queries/effect-queries';
import { updateHeroVillageByCurrentVillageQuery } from '../queries/hero-queries';
import { createEvents } from './create-event';
import { getVillageTileId, updateResourceSiteResourcesAt } from './village';

const resourceProductionEffectIds = [
  'woodProduction',
  'clayProduction',
  'ironProduction',
  'wheatProduction',
] satisfies ResourceProductionEffectId[];

const resourceProductionEffectByResource = {
  wood: 'woodProduction',
  clay: 'clayProduction',
  iron: 'ironProduction',
  wheat: 'wheatProduction',
} satisfies Record<Resource, ResourceProductionEffectId>;

const baseHeroSpeed = 6;
const baseHeroHealthRegeneration = 10;

const getHeroInitialStrength = (tribe: string): number =>
  tribe.toLowerCase() === 'romans' ? 100 : 80;

const getHeroResourceProductionPerPoint = (tribe: string) => {
  const isEgyptian = tribe.toLowerCase() === 'egyptians';

  return {
    shared: isEgyptian ? 12 : 9,
    focused: isEgyptian ? 40 : 30,
  };
};

const getHeroEquipmentBonuses = (database: DbFacade, heroId: number) => {
  const equippedItems = database.selectObjects({
    sql: 'SELECT item_id FROM hero_equipped_items WHERE hero_id = $hero_id',
    bind: { $hero_id: heroId },
    schema: z.strictObject({ item_id: z.number() }),
  });

  const bonuses = {
    power: 0,
    speed: 0,
    damageReduction: 0,
    experienceModifier: 0,
    healthRegeneration: 0,
  };

  for (const { item_id: itemId } of equippedItems) {
    const item = getItemDefinition(itemId);

    for (const bonus of item.heroBonus ?? []) {
      bonuses[bonus.attribute] += bonus.value;
    }
  }

  return bonuses;
};

export const updateHeroEquipmentBonuses = (
  database: DbFacade,
  heroId: number,
): void => {
  const hero = database.selectObject({
    sql: `
      SELECT hsa.attack_power, ti.tribe
      FROM
        heroes h
        JOIN hero_selectable_attributes hsa ON h.id = hsa.hero_id
        JOIN players p ON h.player_id = p.id
        JOIN tribe_ids ti ON p.tribe_id = ti.id
      WHERE
        h.id = $hero_id
    `,
    bind: { $hero_id: heroId },
    schema: z.strictObject({
      attack_power: z.number(),
      tribe: tribeSchema,
    }),
  })!;

  const initialStrength = getHeroInitialStrength(hero.tribe);
  const equipmentBonuses = getHeroEquipmentBonuses(database, heroId);

  database.exec({
    sql: `
      UPDATE heroes
      SET
        base_attack_power = $initial_strength + ($strength_per_point * $attack_power) + $power_bonus,
        health_regeneration = $base_health_regeneration + $health_regeneration_bonus,
        damage_reduction = $damage_reduction_bonus,
        experience_modifier = $experience_modifier_bonus,
        speed = $base_speed + $speed_bonus
      WHERE
        id = $hero_id
    `,
    bind: {
      $hero_id: heroId,
      $initial_strength: initialStrength,
      $strength_per_point: initialStrength,
      $attack_power: hero.attack_power,
      $power_bonus: equipmentBonuses.power,
      $base_health_regeneration: baseHeroHealthRegeneration,
      $health_regeneration_bonus: equipmentBonuses.healthRegeneration,
      $damage_reduction_bonus: equipmentBonuses.damageReduction,
      $experience_modifier_bonus: equipmentBonuses.experienceModifier,
      $base_speed: baseHeroSpeed,
      $speed_bonus: equipmentBonuses.speed,
    },
  });
};

export const addHeroExperience = (
  database: DbFacade,
  experience: number,
): void => {
  database.exec({
    sql: `
      UPDATE heroes
      SET
        experience = experience + CAST(ROUND($experience * (1 + experience_modifier / 100.0)) AS INTEGER)
      WHERE
        player_id = $player_id;
    `,
    bind: {
      $experience: experience,
      $player_id: PLAYER_ID,
    },
  });
};

export const onHeroDeath = (database: DbFacade, timestamp: number) => {
  const villageId = database.selectValue({
    sql: 'SELECT village_id FROM heroes WHERE player_id = $player_id;',
    bind: { $player_id: PLAYER_ID },
    schema: z.number(),
  })!;

  updateResourceSiteResourcesAt(
    database,
    getVillageTileId(database, villageId),
    timestamp,
  );

  database.exec({
    sql: deleteHeroEffectsQuery,
    bind: { $player_id: PLAYER_ID },
  });

  database.exec({
    sql: "DELETE FROM events WHERE type = 'heroHealthRegeneration';",
  });
};

export const updateHeroResourceProductionEffects = ({
  database,
  villageId,
  tribe,
  resourceProduction,
  resourceToProduce,
}: {
  database: DbFacade;
  villageId: number;
  tribe: string;
  resourceProduction: number;
  resourceToProduce: HeroResourceToProduce;
}): void => {
  const productionPerPoint = getHeroResourceProductionPerPoint(tribe);
  const parsedResourceToProduce =
    heroResourceToProduceSchema.parse(resourceToProduce);

  const effects = resourceProductionEffectIds.map((effectId) => ({
    effectId,
    value:
      parsedResourceToProduce === 'shared'
        ? productionPerPoint.shared * resourceProduction
        : resourceProductionEffectByResource[parsedResourceToProduce] ===
            effectId
          ? productionPerPoint.focused * resourceProduction
          : 0,
  }));

  database.exec({
    sql: `
      UPDATE effects
      SET value = json_extract(effect.value, '$.value')
      FROM
        json_each($effects) AS effect
        JOIN effect_ids
          ON effect_ids.effect = json_extract(effect.value, '$.effectId')
      WHERE
        effects.effect_id = effect_ids.id
        AND effects.source_id = (
          SELECT id FROM effect_source_ids WHERE source = 'hero'
        )
        AND effects.source_specifier = 0
        AND effects.tile_id = (
          SELECT tile_id FROM villages WHERE id = $village_id
        );
    `,
    bind: {
      $effects: JSON.stringify(effects),
      $village_id: villageId,
    },
  });
};

export const createHeroHealthRegenerationEventByVillageId = (
  database: DbFacade,
  villageId: number,
  startsAt: number,
) => {
  const { healthRegeneration, speed } = database.selectObject({
    sql: `
      SELECT
        heroes.health_regeneration AS healthRegeneration,
        servers.speed AS speed
      FROM heroes
      CROSS JOIN servers
      WHERE heroes.player_id = (
        SELECT player_id
        FROM villages
        WHERE id = $village_id
      );
    `,
    bind: {
      $village_id: villageId,
    },
    schema: z.strictObject({
      healthRegeneration: z.number(),
      speed: z.number(),
    }),
  })!;

  const duration = calculateHealthRegenerationEventDuration(
    healthRegeneration,
    speed,
  );

  createEvents<'heroHealthRegeneration'>(database, {
    villageId: null,
    type: 'heroHealthRegeneration',
    startsAt,
    duration,
  });
};

export const relocateHero = (
  database: DbFacade,
  currentVillageId: number,
  targetVillageId: number,
  timestamp: number,
) => {
  updateResourceSiteResourcesAt(
    database,
    getVillageTileId(database, currentVillageId),
    timestamp,
  );
  updateResourceSiteResourcesAt(
    database,
    getVillageTileId(database, targetVillageId),
    timestamp,
  );

  database.exec({
    sql: updateHeroVillageByCurrentVillageQuery,
    bind: {
      $current_village_id: currentVillageId,
      $target_village_id: targetVillageId,
    },
  });

  database.exec({
    sql: updateHeroVillageEffectsByVillageIdQuery,
    bind: {
      $current_village_id: currentVillageId,
      $target_village_id: targetVillageId,
    },
  });
};
