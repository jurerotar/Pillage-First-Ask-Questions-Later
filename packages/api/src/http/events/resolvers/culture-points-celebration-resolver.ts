import { z } from 'zod';
import {
  CULTURE_POINTS_CELEBRATION_COSTS,
  calculateCulturePointsCelebrationDuration,
} from '@pillage-first/game-assets/utils/culture-points';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { speedSchema } from '@pillage-first/types/models/server';
import { selectVillageEventExistsByTypeQuery } from '../../../queries/event-queries';
import { completeCelebrationQuestsQuery } from '../../../queries/quest-queries';
import {
  getVillageBuildingLevel,
  requireVillageBuildingLevel,
} from '../../../utils/buildings';
import {
  addPlayerCulturePoints,
  calculateCulturePointsCelebrationReward,
  calculatePlayerCulturePointsProduction,
} from '../../../utils/culture-points';
import { getVillagePlayerId } from '../../../utils/village';
import { defineEventResolver, type Resolver } from '../resolver';

const resolveCulturePointsCelebration: Resolver<
  GameEvent<'culturePointsCelebration'>
> = (_database, args) => {
  return {
    affectedVillageIds: [args.villageId],
    affectedTileIds: [],
  };
};

export const culturePointsCelebrationResolver =
  defineEventResolver<'culturePointsCelebration'>(
    (database, event) => ({
      validate: () => {
        const { villageId, celebrationType } = event;

        const townHallLevel = requireVillageBuildingLevel(
          database,
          villageId,
          'TOWN_HALL',
          'Town Hall is required',
        );

        if (celebrationType === 'large' && townHallLevel < 10) {
          throw new Error('Large celebrations require Town Hall level 10');
        }

        const hasOngoingCelebration = database.selectValue({
          sql: selectVillageEventExistsByTypeQuery,
          bind: {
            $village_id: villageId,
            $type: 'culturePointsCelebration',
          },
          schema: z.coerce.boolean(),
        });

        if (hasOngoingCelebration) {
          throw new Error('Town Hall is already holding a celebration');
        }
      },
      cost: () => {
        const isFree = database.selectValue({
          sql: 'SELECT is_free_celebrations_enabled FROM developer_settings',
          schema: z.coerce.boolean(),
        });

        if (isFree) {
          return [0, 0, 0, 0];
        }

        return CULTURE_POINTS_CELEBRATION_COSTS[event.celebrationType];
      },
      duration: () => {
        const { speed } = database.selectObject({
          sql: 'SELECT speed FROM servers LIMIT 1;',
          schema: z.strictObject({
            speed: speedSchema,
          }),
        })!;

        const townHallLevel = getVillageBuildingLevel(
          database,
          event.villageId,
          'TOWN_HALL',
        );

        const isInstant = database.selectValue({
          sql: 'SELECT is_instant_celebrations_enabled FROM developer_settings',
          schema: z.coerce.boolean(),
        });

        if (isInstant) {
          return 0;
        }

        return calculateCulturePointsCelebrationDuration({
          celebrationType: event.celebrationType,
          townHallLevel,
          serverSpeed: speed,
        });
      },
      afterInsert: (startsAt) => {
        const playerId = getVillagePlayerId(database, event.villageId);

        const production = calculatePlayerCulturePointsProduction(
          database,
          playerId,
        );

        const reward = calculateCulturePointsCelebrationReward(
          database,
          event.villageId,
          event.celebrationType,
          production,
        );

        addPlayerCulturePoints(
          database,
          reward,
          startsAt,
          playerId,
          production,
        );

        database.exec({
          sql: `
            UPDATE culture_points
            SET
              celebrations_held = celebrations_held + 1
            WHERE
              player_id = $player_id;
          `,
          bind: { $player_id: playerId },
        });

        database.exec({
          sql: completeCelebrationQuestsQuery,
          bind: { $completed_at: startsAt, $player_id: playerId },
        });
      },
    }),
    resolveCulturePointsCelebration,
  );
