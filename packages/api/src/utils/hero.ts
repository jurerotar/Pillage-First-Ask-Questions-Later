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
  updateHeroResourceProductionEffectQuery,
} from '../queries/effect-queries.ts';
import { createEvents } from './create-event.ts';
import { updateVillageResourcesAt } from './village.ts';

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

  updateVillageResourcesAt(database, villageId, timestamp);

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

  for (const effectId of resourceProductionEffectIds) {
    const value =
      parsedResourceToProduce === 'shared'
        ? productionPerPoint.shared * resourceProduction
        : resourceProductionEffectByResource[parsedResourceToProduce] ===
            effectId
          ? productionPerPoint.focused * resourceProduction
          : 0;

    database.exec({
      sql: updateHeroResourceProductionEffectQuery,
      bind: {
        $value: value,
        $effect_id: effectId,
        $village_id: villageId,
      },
    });
  }
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
      JOIN servers ON 1 = 1
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
