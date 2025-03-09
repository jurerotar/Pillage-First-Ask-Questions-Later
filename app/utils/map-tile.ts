import type { OasisTile, Tile } from 'app/interfaces/models/game/tile';
import type { Point } from 'app/interfaces/models/common';

export const parseCoordinatesFromTileId = (tileId: Tile['id']): Point => {
  const [stringX, stringY] = tileId.split('|');
  const [x, y] = [Number.parseInt(stringX), Number.parseInt(stringY)];

  return {
    x,
    y,
  };
};

export const parseOasisTileGraphicsProperty = (oasisTileGraphics: OasisTile['graphics']) => {
  const [oasisResource, oasisGroup, oasisGroupPositionString, oasisVariant] = oasisTileGraphics.split('-');
  const groupPositions = oasisGroupPositionString.replace('|', '-');

  return {
    oasisResource,
    oasisGroup,
    groupPositions,
    oasisVariant,
  };
};
