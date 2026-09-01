import { z } from 'zod';
import {
  abandonOasisQuery,
  deleteOasisEffectsQuery,
} from '../../queries/oasis-queries';
import { selectVillageIdByTileIdQuery } from '../../queries/village-queries';
import {
  occupyOasisForVillage,
  returnOasisReinforcements,
} from '../../utils/oasis';
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

    occupyOasisForVillage(db, villageId, oasisTileId, Date.now());
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
