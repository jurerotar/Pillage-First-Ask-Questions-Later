import { z } from 'zod';
import { resourceSchema } from '@pillage-first/types/models/resource';
import { insertEffectByEffectNameQuery } from '../../queries/effect-queries';
import { selectTileOasisBonusesQuery } from '../../queries/map-queries';
import {
  abandonOasisQuery,
  deleteOasisEffectsQuery,
  occupyOasisQuery,
} from '../../queries/oasis-queries';
import {
  selectVillageIdByTileIdQuery,
  selectVillageTileIdQuery,
} from '../../queries/village-queries';
import { returnOasisReinforcements } from '../../utils/oasis';
import { updateResourceSiteResourcesAt } from '../../utils/village';
import { createController } from '../controller';

export const occupyOasis = createController(
  '/tiles/:tileId/oasis/:oasisTileId',
  'post',
  {
    summary: 'Occupy oasis',
    requestParams: {
      path: z.strictObject({
        tileId: z.coerce.number(),
        oasisTileId: z.coerce.number(),
      }),
    },
  },
)(({ database, path: { oasisTileId, tileId } }) => {
  database.transaction((db) => {
    const villageId = db.selectValue({
      sql: selectVillageIdByTileIdQuery,
      bind: {
        $tile_id: tileId,
      },
      schema: z.number(),
    })!;

    updateResourceSiteResourcesAt(db, tileId, Date.now());

    const villageTileId = db.selectValue({
      sql: selectVillageTileIdQuery,
      bind: {
        $village_id: villageId,
      },
      schema: z.number(),
    })!;

    const oasisFieldsRows = db.selectObjects({
      sql: selectTileOasisBonusesQuery,
      bind: {
        $tile_id: oasisTileId,
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
        sql: insertEffectByEffectNameQuery,
        bind: {
          $effect_name: effectId,
          $value: value,
          $type: 'bonus',
          $scope: 'local',
          $source: 'oasis',
          $tile_id: villageTileId,
          $source_specifier: oasisTileId,
        },
      });
    }

    db.exec({
      sql: occupyOasisQuery,
      bind: {
        $oasis_tile_id: oasisTileId,
        $village_id: villageId,
      },
    });
  });
});

export const abandonOasis = createController(
  '/tiles/:tileId/oasis/:oasisTileId',
  'delete',
  {
    summary: 'Abandon oasis',
    requestParams: {
      path: z.strictObject({
        tileId: z.coerce.number(),
        oasisTileId: z.coerce.number(),
      }),
    },
  },
)(({ database, path: { oasisTileId, tileId } }) => {
  database.transaction((db) => {
    const now = Date.now();
    const villageId = db.selectValue({
      sql: selectVillageIdByTileIdQuery,
      bind: {
        $tile_id: tileId,
      },
      schema: z.number(),
    })!;

    updateResourceSiteResourcesAt(db, tileId, now);

    returnOasisReinforcements(db, oasisTileId, villageId, now);

    db.exec({
      sql: deleteOasisEffectsQuery,
      bind: {
        $village_id: villageId,
        $source_specifier: oasisTileId,
      },
    });

    db.exec({
      sql: abandonOasisQuery,
      bind: {
        $oasis_tile_id: oasisTileId,
        $village_id: villageId,
      },
    });
  });
});
