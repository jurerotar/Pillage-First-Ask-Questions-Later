import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import {
  calculateHealthRegenerationInterval,
  calculateHeroAttackPower,
  calculateHeroEquipmentBonuses,
  getHeroHealthAt,
} from '@pillage-first/game-assets/utils/hero';
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
import {
  deleteHeroInventoryItemByHeroIdAndItemIdQuery,
  insertHeroItemIntoHeroInventoryByHeroIdQuery,
  selectHeroIdByPlayerIdQuery,
  selectHeroInventoryAmountByHeroIdAndItemIdQuery,
  updateHeroInventoryItemAmountByHeroIdAndItemIdQuery,
  updateHeroVillageByCurrentVillageQuery,
} from '../queries/hero-queries';
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

export const getHeroIdByPlayerId = (
  database: DbFacade,
  playerId: number,
): number => {
  return database.selectValue({
    sql: selectHeroIdByPlayerIdQuery,
    bind: { $player_id: playerId },
    schema: z.number(),
  })!;
};

export const getHeroInventoryAmount = (
  database: DbFacade,
  heroId: number,
  itemId: number,
): number => {
  return (
    database.selectValue({
      sql: selectHeroInventoryAmountByHeroIdAndItemIdQuery,
      bind: {
        $hero_id: heroId,
        $item_id: itemId,
      },
      schema: z.number(),
    }) ?? 0
  );
};

export const addHeroInventoryItem = (
  database: DbFacade,
  heroId: number,
  itemId: number,
  amount: number,
): void => {
  database.exec({
    sql: insertHeroItemIntoHeroInventoryByHeroIdQuery,
    bind: {
      $hero_id: heroId,
      $item_id: itemId,
      $amount: amount,
    },
  });
};

export const removeHeroInventoryItem = (
  database: DbFacade,
  heroId: number,
  itemId: number,
  amount: number,
): void => {
  const inventoryAmount = getHeroInventoryAmount(database, heroId, itemId);

  if (inventoryAmount < amount) {
    throw new Error('Not enough items in inventory');
  }

  if (inventoryAmount === amount) {
    database.exec({
      sql: deleteHeroInventoryItemByHeroIdAndItemIdQuery,
      bind: {
        $hero_id: heroId,
        $item_id: itemId,
      },
    });

    return;
  }

  database.exec({
    sql: updateHeroInventoryItemAmountByHeroIdAndItemIdQuery,
    bind: {
      $hero_id: heroId,
      $item_id: itemId,
      $amount: amount,
    },
  });
};

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

  return calculateHeroEquipmentBonuses(
    equippedItems.map(({ item_id }) => getItemDefinition(item_id)),
  );
};

export const getNextHeroHealthRegenerationAt = (
  health: number,
  nextHealthRegenerationAt: number | null,
  interval: number,
  timestamp: number,
): number | null => {
  return health > 0 && health < 100 && interval > 0
    ? (nextHealthRegenerationAt ?? timestamp + interval)
    : null;
};

export const getHeroHealthStateAt = (
  database: DbFacade,
  heroId: number,
  timestamp: number,
) => {
  const { health, nextHealthRegenerationAt, healthRegeneration, speed } =
    database.selectObject({
      sql: `
        SELECT health, next_health_regeneration_at AS nextHealthRegenerationAt,
          health_regeneration AS healthRegeneration, servers.speed
        FROM heroes CROSS JOIN servers
        WHERE heroes.id = $hero_id;
      `,
      bind: { $hero_id: heroId },
      schema: z.strictObject({
        health: z.number(),
        nextHealthRegenerationAt: z.number().nullable(),
        healthRegeneration: z.number(),
        speed: z.number(),
      }),
    })!;

  const interval = calculateHealthRegenerationInterval(
    healthRegeneration,
    speed,
  );

  return {
    ...getHeroHealthAt(health, nextHealthRegenerationAt, interval, timestamp),
    interval,
    speed,
  };
};

export const updateHeroEquipmentBonuses = (
  database: DbFacade,
  heroId: number,
): void => {
  const hero = database.selectObject({
    sql: `
      SELECT
        hsa.attack_power,
        ti.tribe
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

  const equipmentBonuses = getHeroEquipmentBonuses(database, heroId);
  const now = Date.now();

  const { health, nextHealthRegenerationAt, speed } = getHeroHealthStateAt(
    database,
    heroId,
    now,
  );
  const healthRegeneration =
    baseHeroHealthRegeneration + equipmentBonuses.healthRegeneration;
  const interval = calculateHealthRegenerationInterval(
    healthRegeneration,
    speed,
  );

  database.exec({
    sql: `
      UPDATE heroes
      SET
        base_attack_power = $attack_power,
        health = $health,
        next_health_regeneration_at = $next_health_regeneration_at,
        health_regeneration = $health_regeneration,
        damage_reduction = $damage_reduction_bonus,
        experience_modifier = $experience_modifier_bonus,
        speed = $base_speed + $speed_bonus
      WHERE
        id = $hero_id
    `,
    bind: {
      $hero_id: heroId,
      $attack_power: calculateHeroAttackPower(
        hero.tribe,
        hero.attack_power,
        equipmentBonuses.power,
      ),
      $health: health,
      $next_health_regeneration_at: getNextHeroHealthRegenerationAt(
        health,
        nextHealthRegenerationAt,
        interval,
        now,
      ),
      $health_regeneration: healthRegeneration,
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
  playerId: number,
): void => {
  database.exec({
    sql: `
      UPDATE heroes
      SET
        experience = experience + CAST(
          ROUND($experience * (1 + experience_modifier / 100.0)) AS INTEGER
        )
      WHERE
        player_id = $player_id;
    `,
    bind: {
      $experience: experience,
      $player_id: playerId,
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
    sql: 'UPDATE heroes SET next_health_regeneration_at = NULL WHERE player_id = $player_id;',
    bind: { $player_id: PLAYER_ID },
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
      SET
        value = json_extract(effect.value, '$.value')
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
