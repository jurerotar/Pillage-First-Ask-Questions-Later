import { z } from 'zod';
import {
  CULTURE_POINTS_CELEBRATION_COSTS,
  calculateCulturePointsCelebrationDuration,
  calculateCulturePointsCelebrationReward,
} from '@pillage-first/game-assets/utils/culture-points';
import { culturePointsCelebrationTypeSchema } from '@pillage-first/types/models/celebration';
import { speedSchema } from '@pillage-first/types/models/server';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { completeCelebrationQuestsQuery } from '../../queries/quest-queries';
import { requireVillageBuildingLevel } from '../../utils/buildings';
import {
  addPlayerCulturePoints,
  calculatePlayerCulturePointsProduction,
  calculateVillageCulturePointsProduction,
} from '../../utils/culture-points';
import {
  getVillagePlayerId,
  getVillageTileId,
  subtractResourceSiteResourcesAt,
} from '../../utils/village';
import { createController } from '../controller';

const celebrationPath = '/villages/:villageId/celebration';
const celebrationPathSchema = z.strictObject({
  villageId: z.coerce.number().int().positive(),
});
const celebrationSchema = z.strictObject({
  celebrationType: culturePointsCelebrationTypeSchema,
  endsAt: z.number(),
});

const getActiveCelebration = (
  database: DbFacade,
  villageId: number,
  now: number,
) => {
  return (
    database.selectObject({
      sql: `
      SELECT celebration_type AS celebrationType, celebration_ends_at AS endsAt
      FROM villages
      WHERE id = $village_id AND celebration_ends_at > $now;
    `,
      bind: { $village_id: villageId, $now: now },
      schema: celebrationSchema,
    }) ?? null
  );
};

export const getVillageCelebration = createController(celebrationPath, {
  summary: 'Get the active Town Hall celebration',
  requestParams: { path: celebrationPathSchema },
  response: celebrationSchema.nullable(),
})(({ database, path: { villageId } }) => {
  return getActiveCelebration(database, villageId, Date.now());
});

export const startVillageCelebration = createController(
  celebrationPath,
  'post',
  {
    summary: 'Start a Town Hall celebration',
    requestParams: { path: celebrationPathSchema },
    requestBody: z.strictObject({
      celebrationType: culturePointsCelebrationTypeSchema,
    }),
  },
)(
  ({
    database,
    context: { playerId },
    path: { villageId },
    body: { celebrationType },
  }) => {
    database.transaction((tx) => {
      const now = Date.now();

      if (getVillagePlayerId(tx, villageId) !== playerId) {
        throw new Error('Village does not belong to player');
      }

      const townHallLevel = requireVillageBuildingLevel(
        tx,
        villageId,
        'TOWN_HALL',
        'Town Hall is required',
      );

      if (celebrationType === 'large' && townHallLevel < 10) {
        throw new Error('Large celebrations require Town Hall level 10');
      }

      if (getActiveCelebration(tx, villageId, now)) {
        throw new Error('Town Hall is already holding a celebration');
      }

      const { speed, isFree, isInstant } = tx.selectObject({
        sql: `
        SELECT s.speed, d.is_free_celebrations_enabled AS isFree,
          d.is_instant_celebrations_enabled AS isInstant
        FROM servers s CROSS JOIN developer_settings d
        LIMIT 1;
      `,
        schema: z.strictObject({
          speed: speedSchema,
          isFree: z.coerce.boolean(),
          isInstant: z.coerce.boolean(),
        }),
      })!;

      if (!isFree) {
        const cost = CULTURE_POINTS_CELEBRATION_COSTS[celebrationType];
        const [wood, clay, iron, wheat] = cost;

        subtractResourceSiteResourcesAt(
          tx,
          getVillageTileId(tx, villageId),
          now,
          ({ currentWood, currentClay, currentIron, currentWheat }) => {
            if (
              currentWood < wood ||
              currentClay < clay ||
              currentIron < iron ||
              currentWheat < wheat
            ) {
              throw new Error('Not enough resources');
            }

            return cost;
          },
        );
      }

      if (!isInstant) {
        const duration = calculateCulturePointsCelebrationDuration({
          celebrationType,
          townHallLevel,
          serverSpeed: speed,
        });

        tx.exec({
          sql: `
          UPDATE villages
          SET celebration_type = $type, celebration_ends_at = $ends_at
          WHERE id = $village_id;
        `,
          bind: {
            $village_id: villageId,
            $type: celebrationType,
            $ends_at: now + duration,
          },
        });
      }

      const production = calculatePlayerCulturePointsProduction(tx, playerId);
      const reward = calculateCulturePointsCelebrationReward(
        celebrationType,
        celebrationType === 'small'
          ? calculateVillageCulturePointsProduction(tx, villageId)
          : production,
      );

      addPlayerCulturePoints(tx, reward, now, playerId, production);

      tx.exec({
        sql: `
        UPDATE culture_points
        SET celebrations_held = celebrations_held + 1
        WHERE player_id = $player_id;
      `,
        bind: { $player_id: playerId },
      });
      tx.exec({
        sql: completeCelebrationQuestsQuery,
        bind: { $completed_at: now, $player_id: playerId },
      });
    });
  },
);
