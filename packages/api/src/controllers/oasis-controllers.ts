import { z } from 'zod';
import { resourceSchema } from '@pillage-first/types/models/resource';
import type { Controller } from '../types/controller';
import { updateVillageResourcesAt } from '../utils/village';

// TODO: Move this to an util function that's called after combat, once combat is added
/**
 * POST /villages/:villageId/oasis/:oasisId
 * @pathParam {number} villageId
 * @pathParam {number} oasisId
 */
export const occupyOasis: Controller<
  '/villages/:villageId/oasis/:oasisId',
  'post'
> = (database, args) => {
  const {
    params: { oasisId, villageId },
  } = args;
  // TODO: Add Hero's mansion level & empty oasis slot check

  database.transaction((db) => {
    updateVillageResourcesAt(db, villageId, Date.now());

    const oasisFieldsRows = db.selectObjects({
      sql: `
        SELECT resource,
               bonus
        FROM oasis
        WHERE tile_id = $tile_id;
      `,
      bind: {
        $tile_id: oasisId,
      },
      schema: z.object({
        resource: resourceSchema,
        bonus: z.number(),
      }),
    });

    for (const { resource, bonus } of oasisFieldsRows) {
      const effectId = `${resource}Production`;
      const value = bonus === 25 ? 1.25 : 1.5;

      db.exec({
        sql: `
          INSERT INTO effects (effect_id, value, type, scope, source, village_id, source_specifier)
          VALUES ((SELECT id FROM effect_ids WHERE effect = $effect_id), $value, $type, $scope, $source, $village_id, $source_specifier);
        `,
        bind: {
          $effect_id: effectId,
          $value: value,
          $type: 'bonus',
          $scope: 'village',
          $source: 'oasis',
          $village_id: villageId,
          $source_specifier: oasisId,
        },
      });
    }

    db.exec({
      sql: `
        UPDATE oasis
        SET village_id = $village_id
        WHERE tile_id = $oasis_tile_id;
      `,
      bind: {
        $oasis_tile_id: oasisId,
        $village_id: villageId,
      },
    });
  });
};

/**
 * DELETE /villages/:villageId/oasis/:oasisId
 * @pathParam {number} villageId
 * @pathParam {number} oasisId
 */
export const abandonOasis: Controller<
  '/villages/:villageId/oasis/:oasisId',
  'delete'
> = (database, args) => {
  const {
    params: { oasisId, villageId },
  } = args;

  database.transaction((db) => {
    updateVillageResourcesAt(db, villageId, Date.now());

    db.exec({
      sql: `
        DELETE
        FROM effects
        WHERE source = 'oasis'
          AND village_id = $village_id
          AND source_specifier = $source_specifier;
      `,
      bind: {
        $village_id: villageId,
        $source_specifier: oasisId,
      },
    });

    db.exec({
      sql: `
        UPDATE oasis
        SET village_id = NULL
        WHERE tile_id = $oasis_tile_id
          AND village_id = $village_id;
      `,
      bind: {
        $oasis_tile_id: oasisId,
        $village_id: villageId,
      },
    });
  });
};
