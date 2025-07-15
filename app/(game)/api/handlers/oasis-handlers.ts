import type { ApiHandler } from 'app/interfaces/api';
import type {
  OasisTile,
  OccupiedOasisTile,
  Tile,
} from 'app/interfaces/models/game/tile';
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
  args,
) => {
  const {
    params: { oasisId: oasisIdParam, villageId: villageIdParam },
  } = args;
  // TODO: Add Hero's mansion level & empty oasis slot check

  const oasisId = Number.parseInt(oasisIdParam);
  const villageId = Number.parseInt(villageIdParam);

  updateVillageResourcesAt(queryClient, villageId, Date.now());

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

  queryClient.setQueryData<Tile[]>([mapCacheKey], (tiles) => {
    return tiles!.map((tile) => {
      if (tile.id !== oasisId) {
        return tile;
      }

      const cell = tile as OccupiedOasisTile;
      cell.villageId = villageId;

      return cell;
    });
  });
};

export const abandonOasis: ApiHandler<void, 'oasisId' | 'villageId'> = async (
  queryClient,
  args,
) => {
  const {
    params: { oasisId: oasisIdParam, villageId: villageIdParam },
  } = args;

  const oasisId = Number.parseInt(oasisIdParam);
  const villageId = Number.parseInt(villageIdParam);

  updateVillageResourcesAt(queryClient, villageId, Date.now());

  const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
  const targetOasisTile = tiles.find(
    ({ id }) => id === oasisId,
  )! as OccupiedOasisTile;

  if (!targetOasisTile) {
    return;
  }

  queryClient.setQueryData<Effect[]>([effectsCacheKey], (effects) => {
    return effects!.filter((effect) => {
      if (!isOasisEffect(effect)) {
        return true;
      }

      return !(effect.villageId === villageId && effect.oasisId === oasisId);
    });
  });

  queryClient.setQueryData<Tile[]>([mapCacheKey], (tiles) => {
    return tiles!.map((tile) => {
      if (tile.id !== oasisId) {
        return tile;
      }

      const cell = tile as OasisTile;
      cell.villageId = null;

      return cell;
    });
  });
};
