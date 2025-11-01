import type {
  OasisTile,
  OccupiableTile,
  OccupiedOasisTile,
  OccupiedOccupiableTile,
  Tile,
} from 'app/interfaces/models/game/tile';

export const isOasisTile = (tile: Tile): tile is OasisTile => {
  return tile.type === 1;
};

export const isOccupiableOasisTile = (tile: Tile): tile is OasisTile => {
  return isOasisTile(tile) && tile.ORB.length > 0;
};

export const isOccupiedOasisTile = (tile: Tile): tile is OccupiedOasisTile => {
  return isOccupiableOasisTile(tile) && tile.villageId !== null;
};

export const isOccupiableTile = (tile: Tile): tile is OccupiableTile => {
  return tile.type === 0;
};

export const isOccupiedOccupiableTile = (
  tile: Tile,
): tile is OccupiedOccupiableTile => {
  return isOccupiableTile(tile) && Object.hasOwn(tile, 'ownedBy');
};
