import { z } from 'zod';
import {
  calculateTrapperCapacity,
  TRAPPER_CAGE_BASE_DURATION,
  TRAPPER_CAGE_COST,
} from '@pillage-first/game-assets/utils/trapper';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { mapResourceBundle } from '@pillage-first/types/models/resource';
import { speedSchema } from '@pillage-first/types/models/server';
import { requireVillageBuildingLevel } from '../../../utils/buildings';
import { defineEventResolver, type Resolver } from '../resolver';

const resolveTrapperCageProduction: Resolver<
  GameEvent<'trapperCageProduction'>
> = (database, args) => {
  const { villageId } = args;

  database.exec({
    sql: `
      INSERT INTO trapper_cages (village_id, unit_id)
      VALUES ($village_id, NULL);
    `,
    bind: { $village_id: villageId },
  });

  return {
    affectedVillageIds: [villageId],
    affectedTileIds: [],
  };
};

export const trapperCageProductionResolver =
  defineEventResolver<'trapperCageProduction'>(
    (database, event) => ({
      validate: () => {
        const { villageId, amount } = event;

        const trapperLevel = requireVillageBuildingLevel(
          database,
          villageId,
          'TRAPPER',
          'Trapper does not exist',
        );

        const currentCageAmount = database.selectValue({
          sql: `
            SELECT COUNT(*)
            FROM
              trapper_cages
            WHERE
              village_id = $village_id;
          `,
          bind: {
            $village_id: villageId,
          },
          schema: z.number(),
        })!;

        const queuedCageAmount =
          database.selectValue({
            sql: `
              SELECT COUNT(*)
              FROM
                events
              WHERE
                village_id = $village_id
                AND type = 'trapperCageProduction';
            `,
            bind: {
              $village_id: villageId,
            },
            schema: z.number(),
          }) ?? 0;

        const capacity = calculateTrapperCapacity(trapperLevel);

        if (currentCageAmount + queuedCageAmount + amount > capacity) {
          throw new Error('Trapper cage capacity exceeded');
        }
      },
      cost: () => {
        const isFreeUnitTrainingEnabled = database.selectValue({
          sql: 'SELECT is_free_unit_training_enabled FROM developer_settings',
          schema: z.coerce.boolean(),
        });

        if (isFreeUnitTrainingEnabled) {
          return [0, 0, 0, 0];
        }

        return mapResourceBundle(
          TRAPPER_CAGE_COST,
          (cost) => cost * event.amount,
        );
      },
      duration: () => {
        const isInstantUnitTrainingEnabled = database.selectValue({
          sql: 'SELECT is_instant_unit_training_enabled FROM developer_settings',
          schema: z.coerce.boolean(),
        });

        if (isInstantUnitTrainingEnabled) {
          return 0;
        }

        const speed = database.selectValue({
          sql: 'SELECT speed FROM servers LIMIT 1;',
          schema: speedSchema,
        })!;

        return TRAPPER_CAGE_BASE_DURATION / speed;
      },
      startTime: () => {
        const { villageId } = event;
        const now = Date.now();

        return database.selectValue({
          sql: `
            SELECT COALESCE(MAX(resolves_at), $now)
            FROM
              events
            WHERE
              village_id = $village_id
              AND type = 'trapperCageProduction';
          `,
          bind: {
            $village_id: villageId,
            $now: now,
          },
          schema: z.number(),
        })!;
      },
    }),
    resolveTrapperCageProduction,
  );
