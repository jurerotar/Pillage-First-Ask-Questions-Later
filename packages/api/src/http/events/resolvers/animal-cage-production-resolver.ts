import { z } from 'zod';
import {
  ANIMAL_CAGE_BASE_DURATION,
  ANIMAL_CAGE_COST,
  ANIMAL_CAGE_ITEM_ID,
} from '@pillage-first/game-assets/utils/hunters-lodge';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { mapResourceBundle } from '@pillage-first/types/models/resource';
import { speedSchema } from '@pillage-first/types/models/server';
import { insertHeroItemIntoHeroInventoryQuery } from '../../../queries/hero-queries';
import { defineEventResolver, type Resolver } from '../resolver';
import { requireHuntersLodgeLevel } from './hunters-lodge-event-helpers';

const resolveAnimalCageProduction: Resolver<
  GameEvent<'animalCageProduction'>
> = (database, args) => {
  const { villageId } = args;

  database.exec({
    sql: insertHeroItemIntoHeroInventoryQuery,
    bind: {
      $village_id: villageId,
      $item_id: ANIMAL_CAGE_ITEM_ID,
      $amount: 1,
    },
  });

  return {
    affectedVillageIds: [villageId],
    affectedTileIds: [],
  };
};

export const animalCageProductionResolver =
  defineEventResolver<'animalCageProduction'>(
    (database, event) => ({
      validate: () => {
        requireHuntersLodgeLevel(database, event.villageId);
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
          ANIMAL_CAGE_COST,
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

        return ANIMAL_CAGE_BASE_DURATION / speed;
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
              AND type = 'animalCageProduction';
          `,
          bind: {
            $village_id: villageId,
            $now: now,
          },
          schema: z.number(),
        })!;
      },
    }),
    resolveAnimalCageProduction,
  );
