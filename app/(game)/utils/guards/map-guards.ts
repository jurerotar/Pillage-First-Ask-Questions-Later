import type { OasisTile, OccupiableTile, OccupiedOasisTile, OccupiedOccupiableTile, Tile } from 'app/interfaces/models/game/tile';

export const isOasisTile = (tile: Tile): tile is OasisTile => {
  return tile.type === 'oasis-tile';
};

export const isOccupiableOasisTile = (tile: Tile): tile is OasisTile => {
  return isOasisTile(tile) && tile.oasisResourceBonus.length > 0;
};

export const isUnoccupiedOasisTile = (tile: Tile): tile is OasisTile => {
  return isOccupiableOasisTile(tile) && tile.villageId === null;
};

export const isOccupiedOasisTile = (tile: Tile): tile is OccupiedOasisTile => {
  return isOccupiableOasisTile(tile) && tile.villageId !== null;
};

export const isOccupiableTile = (tile: Tile): tile is OccupiableTile => {
  return tile.type === 'free-tile';
};

export const isOccupiedOccupiableTile = (tile: Tile): tile is OccupiedOccupiableTile => {
  return isOccupiableTile(tile) && Object.hasOwn(tile, 'ownedBy');
};

export const isUnoccupiedOccupiableTile = (tile: Tile): tile is OccupiedOccupiableTile => {
  return isOccupiableTile(tile) && !Object.hasOwn(tile, 'ownedBy');
};
