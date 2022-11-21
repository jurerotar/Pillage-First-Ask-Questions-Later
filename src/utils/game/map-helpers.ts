import { Point, Size } from 'interfaces/models/common';
import { Tile } from 'interfaces/models/game/tile';

export const calculateSquareTilePoints = (offsetX: number, offsetY: number, tileDimensions: Size): Point[] => {
  const point1: Point = {
    x: offsetX,
    y: offsetY
  };
  const point2: Point = {
    x: offsetX + tileDimensions.width,
    y: offsetY
  };
  const point3: Point = {
    x: offsetX + tileDimensions.width,
    y: offsetY + tileDimensions.height
  };
  const point4: Point = {
    x: offsetX,
    y: offsetY + tileDimensions.height
  };
  return [point1, point2, point3, point4];
};

export const calculateSquareTileOffset = (tile: Tile, canvasDimensions: Size, tileDimensions: Size): Point => {
  return {
    x: (tile.x - 1) * tileDimensions.width + canvasDimensions.width / 2,
    y: -(tile.y + 1) * tileDimensions.height + canvasDimensions.height / 2
  };
};
