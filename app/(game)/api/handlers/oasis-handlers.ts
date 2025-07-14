import type { ApiHandler } from 'app/interfaces/api';
import type {
  OasisTile,
  OccupiedOasisTile,
  Tile,
} from 'app/interfaces/models/game/tile';
import { mapCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

export const abandonOasis: ApiHandler<void, 'oasisId'> = async (
  queryClient,
  args,
) => {
  const {
    params: { oasisId: oasisIdParam },
  } = args;

  const oasisId = Number.parseInt(oasisIdParam);

  const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
  const targetOasisTile = tiles.find(
    ({ id }) => id === oasisId,
  )! as OccupiedOasisTile;

  if (!targetOasisTile) {
    return;
  }

  const villageId = targetOasisTile.villageId;

  // TODO: Remove effect

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
