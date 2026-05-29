import { z } from 'zod';
import { resourceSchema } from '@pillage-first/types/models/resource';
import { selectTileOasisBonusesQuery } from '../../queries/map-queries';
import {
  abandonOasisQuery,
  deleteOasisEffectsQuery,
  insertOasisProductionEffectQuery,
  occupyOasisQuery,
} from '../../queries/oasis-queries';
import { updateVillageResourcesAt } from '../../utils/village';
import { createController } from '../controller';

export const occupyOasis = createController(
  '/villages/:villageId/oasis/:oasisId',
  'post',
  {
    summary: 'Occupy oasis',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
        oasisId: z.coerce.number(),
      }),
    },
  },
)(({ database, path: { oasisId, villageId } }) => {
  database.transaction((db) => {
    updateVillageResourcesAt(db, villageId, Date.now());

    const oasisFieldsRows = db.selectObjects({
      sql: selectTileOasisBonusesQuery,
      bind: {
        $tile_id: oasisId,
      },
      schema: z.strictObject({
        resource: resourceSchema,
        bonus: z.number(),
      }),
    });

    for (const { resource, bonus } of oasisFieldsRows) {
      const effectId = `${resource}Production`;
      const value = bonus === 25 ? 1.25 : 1.5;

      db.exec({
        sql: insertOasisProductionEffectQuery,
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
      sql: occupyOasisQuery,
      bind: {
        $oasis_tile_id: oasisId,
        $village_id: villageId,
      },
    });
  });
});

export const abandonOasis = createController(
  '/villages/:villageId/oasis/:oasisId',
  'delete',
  {
    summary: 'Abandon oasis',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
        oasisId: z.coerce.number(),
      }),
    },
  },
)(({ database, path: { oasisId, villageId } }) => {
  database.transaction((db) => {
    updateVillageResourcesAt(db, villageId, Date.now());

    db.exec({
      sql: deleteOasisEffectsQuery,
      bind: {
        $village_id: villageId,
        $source_specifier: oasisId,
      },
    });

    db.exec({
      sql: abandonOasisQuery,
      bind: {
        $oasis_tile_id: oasisId,
        $village_id: villageId,
      },
    });
  });
});
