import type {
  OasisTile,
  OccupiableTile,
  OccupiedOasisTile,
  OccupiedOccupiableTile,
  Tile,
} from '@pillage-first/types/models/tile';

export const isOasisTile = (tile: Tile): tile is OasisTile => {
  return tile.type === 'oasis';
};

export const isOccupiableOasisTile = (tile: Tile): tile is OasisTile => {
  return isOasisTile(tile) && tile.attributes.isOccupiable;
};

export const isOccupiedOasisTile = (tile: Tile): tile is OccupiedOasisTile => {
  return isOccupiableOasisTile(tile) && tile.owner !== null;
};

export const isOccupiableTile = (tile: Tile): tile is OccupiableTile => {
  return tile.type === 'free';
};

export const isOccupiedOccupiableTile = (
  tile: Tile,
): tile is OccupiedOccupiableTile => {
  return isOccupiableTile(tile) && tile.owner !== null;
};
