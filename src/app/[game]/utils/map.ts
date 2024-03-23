import { OasisTile, OccupiableTile, OccupiedOasisTile, OccupiedOccupiableTile, Tile } from 'interfaces/models/game/tile';

export const isOasisTile = (tile: Tile): tile is OasisTile => {
  return tile.type === 'oasis-tile';
};

export const isOccupiableOasisTile = (tile: Tile): tile is OasisTile => {
  return tile.type === 'oasis-tile' && tile.oasisResourceBonus.length > 0;
};

export const isOccupiedOasisTile = (tile: Tile): tile is OccupiedOasisTile => {
  return tile.type === 'oasis-tile' && tile.villageId !== null;
};

export const isOccupiableTile = (tile: Tile): tile is OccupiableTile => {
  return tile.type === 'free-tile';
};

export const isOccupiedOccupiableTile = (tile: Tile): tile is OccupiedOccupiableTile => {
  return tile.type === 'free-tile' && Object.hasOwn(tile, 'ownedBy');
};

export const isTreasuryTile = (tile: Tile): tile is OccupiedOccupiableTile => {
  return tile.type === 'free-tile' && (tile as OccupiedOccupiableTile).treasureType !== null;
};
