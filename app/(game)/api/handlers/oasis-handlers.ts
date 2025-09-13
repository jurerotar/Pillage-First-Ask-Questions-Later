import type { ApiHandler } from 'app/interfaces/api';
import type { OasisTile, Tile } from 'app/interfaces/models/game/tile';
import {
  effectsCacheKey,
  mapCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import type { Effect } from 'app/interfaces/models/game/effect';
import { isOasisEffect } from 'app/(game)/(village-slug)/hooks/guards/effect-guards';
import { oasisEffectsFactory } from 'app/factories/effect-factory';
import { updateVillageResourcesAt } from 'app/(game)/api/utils/village';

// TODO: Move this to an util function that's called after combat, once combat is added
export const occupyOasis: ApiHandler<void, 'oasisId' | 'villageId'> = async (
  queryClient,
  database,
  args,
) => {
  const {
    params: { oasisId, villageId },
  } = args;
  // TODO: Add Hero's mansion level & empty oasis slot check

  updateVillageResourcesAt(queryClient, database, villageId, Date.now());

  const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
  const targetOasisTile = tiles.find(({ id }) => id === oasisId)! as OasisTile;

  queryClient.setQueryData<Effect[]>([effectsCacheKey], (effects) => {
    const oasisEffects = oasisEffectsFactory(
      villageId,
      targetOasisTile.id,
      targetOasisTile.ORB,
    );

    return [...effects!, ...oasisEffects];
  });

  database.exec({
    sql: `
      UPDATE oasis
      SET village_id = $village_id
      WHERE tile_id  = $oasis_tile_id
        AND village_id IS NULL;
    `,
    bind: {
      $oasis_tile_id: oasisId,
      $village_id: villageId,
    },
  });
};

export const abandonOasis: ApiHandler<void, 'oasisId' | 'villageId'> = async (
  queryClient,
  database,
  args,
) => {
  const {
    params: { oasisId, villageId },
  } = args;

  updateVillageResourcesAt(queryClient, database, villageId, Date.now());

  queryClient.setQueryData<Effect[]>([effectsCacheKey], (effects) => {
    return effects!.filter((effect) => {
      if (!isOasisEffect(effect)) {
        return true;
      }

      return !(effect.villageId === villageId && effect.oasisId === oasisId);
    });
  });

  database.exec({
    sql: `
      UPDATE oasis
      SET village_id = NULL
      WHERE tile_id   = $oasis_tile_id
        AND village_id = $village_id;
    `,
    bind: {
      $oasis_tile_id: oasisId,
      $village_id: villageId,
    },
  });
};
