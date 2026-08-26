import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { calculateHealthRegenerationEventDuration } from '@pillage-first/game-assets/utils/hero';
import type { ResourceProductionEffectId } from '@pillage-first/types/models/effect';
import {
  type HeroResourceToProduce,
  heroResourceToProduceSchema,
} from '@pillage-first/types/models/hero';
import type { Resource } from '@pillage-first/types/models/resource';
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

const getHeroResourceProductionPerPoint = (tribe: string) => {
  const isEgyptian = tribe.toLowerCase() === 'egyptians';

  return {
    shared: isEgyptian ? 12 : 9,
    focused: isEgyptian ? 40 : 30,
  };
};

export const addHeroExperience = (
  database: DbFacade,
  experience: number,
): void => {
  database.exec({
    sql: `
      UPDATE heroes
      SET
        experience = experience + $experience
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
