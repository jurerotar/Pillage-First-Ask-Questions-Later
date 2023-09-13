import React, { useEffect, useRef } from 'react';
import { useMap } from 'hooks/game/use-map';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { useCurrentVillage } from 'hooks/game/use-current-village';
import { Point, Size } from 'interfaces/models/common';
import { useWindowSize } from 'usehooks-ts';
import { Tile } from 'interfaces/models/game/tile';

const TILE_SIZE_MODIFIER = 25;

const tileSize: Size = {
  height: TILE_SIZE_MODIFIER,
  width: 2 * TILE_SIZE_MODIFIER
};

const isBetween = (number: number, lowerLimit: number, upperLimit: number): boolean => {
  return number >= lowerLimit && number <= upperLimit;
};

const getMaxCanvasSize = (mapSize: number): Size => ({
  height: mapSize * tileSize.height,
  width: mapSize * tileSize.width
});

type GetTilesInViewportParams = {
  map: Tile[];
  cameraCenter: Point;
  mapSize: number;
  viewportSize: Size;
};

const getTilesInViewport = (params: GetTilesInViewportParams): Tile[] => {
  const {
    map,
    cameraCenter,
    mapSize,
    viewportSize
  } = params;

  const {
    height: maxCanvasHeight,
    width: maxCanvasWidth
  } = getMaxCanvasSize(mapSize);

  const halfMaxCanvasWidth = Math.round(maxCanvasWidth / 2);
  const halfMaxCanvasHeight = Math.round(maxCanvasHeight / 2);
  const halfViewportWidth = Math.round(viewportSize.width / 2);
  const halfViewportHeight = Math.round(viewportSize.height / 2);

  const limits: Record<keyof Point, [number, number]> = {
    x: [halfMaxCanvasWidth - halfViewportWidth - cameraCenter.x, halfMaxCanvasWidth + halfViewportWidth + cameraCenter.x],
    y: [halfMaxCanvasHeight - halfViewportHeight - cameraCenter.y, halfMaxCanvasHeight + halfViewportHeight + cameraCenter.y]
  };

  return map.filter((tile: Tile) => {
    const { x, y } = tile.coordinates;
    const [xPosition, yPosition] = [x * tileSize.width, y * tileSize.height];

    console.log(x, y, xPosition, yPosition);
    return (isBetween(xPosition, ...limits.x) && isBetween(yPosition, ...limits.y));
  });
};

export const MapPage: React.FC = () => {
  const { map } = useMap();
  const { server } = useCurrentServer();
  const { currentVillage } = useCurrentVillage();
  const { height, width } = useWindowSize();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const mapSize = server?.configuration?.mapSize;

  // Map is always centered to current village initially
  const currentVillageCoordinates: Point = {
    x: 0,
    y: 0
  }; // currentVillage?.position;

  const isLoading = (map.length === 0 || !server);

  console.log(mapSize, currentVillageCoordinates);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    const canvasContext = canvasRef.current!.getContext('2d');
    const tilesInViewport = getTilesInViewport({
      map,
      cameraCenter: currentVillageCoordinates,
      mapSize: mapSize!,
      viewportSize: {
        height,
        width
      }
    });

    console.log(tilesInViewport);
  }, [isLoading]);

  if (isLoading) {
    return <>Loading map</>;
  }

  return (
    <div className="">
      <canvas
        ref={canvasRef}
        id="map"
        height={height}
        width={width}
      />
    </div>
  );
};

// https://stackoverflow.com/questions/45528111/javascript-canvas-map-style-point-zooming
