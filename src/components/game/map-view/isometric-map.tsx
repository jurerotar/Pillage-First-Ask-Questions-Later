import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useWindowSize } from 'utils/hooks/use-window-size';
import { useOutletContext } from 'react-router-dom';
import { useContextSelector } from 'use-context-selector';
import { GameContext } from 'providers/game/game-context';
import { Point, Size } from 'interfaces/models/common';
import { Tile } from 'interfaces/models/game/tile';
import { MapGeneratorService } from 'services/map-generator-service';
import { VillageContext } from 'providers/game/village-context';

type ContextType = {
  navigationElement: React.RefObject<HTMLElement>;
};

const { BORDER_SIZE } = MapGeneratorService;
const BASE_TILE_SIZE: number = 100;

const calculateTileOffset = (tile: Tile, canvasDimensions: Size, tileDimensions: Size): [number, number] => {
  return [
    ((tile.coordinates.x - 1) * tileDimensions.width + tile.coordinates.y * tileDimensions.width) + canvasDimensions.width / 2,
    -((tile.coordinates.y + 1) * tileDimensions.height - tile.coordinates.x * tileDimensions.height) + canvasDimensions.height / 2
  ];
};

const calculateTilePoints = (offsetX: number, offsetY: number, tileDimensions: Size): Point[] => {
  const point1: Point = {
    x: offsetX,
    y: offsetY + tileDimensions.height
  };
  const point2: Point = {
    x: offsetX + tileDimensions.width,
    y: offsetY
  };
  const point3: Point = {
    x: offsetX + 2 * tileDimensions.width,
    y: offsetY + tileDimensions.height
  };
  const point4: Point = {
    x: offsetX + tileDimensions.width,
    y: offsetY + 2 * tileDimensions.height
  };
  return [point1, point2, point3, point4];
};

const draw = (data: Tile[], context: CanvasRenderingContext2D, canvasDimensions: Size, tileDimensions: Size): void => {
  context.clearRect(0, 0, canvasDimensions.width, canvasDimensions.height);
  context.strokeStyle = 'black';
  context.font = '10px';

  for (const tile of data) {
    // Offsets determine starting position for each tile
    const [offsetX, offsetY] = calculateTileOffset(tile, canvasDimensions, tileDimensions);
    const [point1, point2, point3, point4] = calculateTilePoints(offsetX, offsetY, tileDimensions);

    context.fillStyle = tile.backgroundColor;

    const path = new Path2D(`M${point1.x},${point1.y} L${point2.x},${point2.y} L${point3.x},${point3.y} L${point4.x},${point4.y} Z`);
    context.fill(path);

    const textPosition: Point = {
      x: offsetX + tileDimensions.width - 15,
      y: offsetY + tileDimensions.height + 1
    };

    context.beginPath();
    // context.strokeText(tile?.type ? `${tile.type}` : `(${tile.oasisGroup})`, textPosition.x, textPosition.y);
    context.strokeText(`(${tile.coordinates.x}, ${tile.coordinates.y})`, textPosition.x, textPosition.y);
    context.stroke();
    context.closePath();
  }
};

export const IsometricMap: React.FC = () => {
  const {
    width,
    height
  } = useWindowSize();
  const { navigationElement } = useOutletContext<ContextType>();
  const selectedVillage = useContextSelector(VillageContext, (v) => v.selectedVillage);
  const server = useContextSelector(GameContext, (v) => v.server);
  const tiles = useContextSelector(GameContext, (v) => v.tiles);

  const [tileMagnification, setTileMagnification] = useState<1 | 0.5 | 0.25>(1);

  // We use a layered canvas approach to reduce the amount of things we need to draw.
  // This one is used for base map, without any effects (attacks,...) or user actions (tile outlining).
  const backgroundCanvas = useRef<HTMLCanvasElement | null>(null);
  const activeEffectsCanvas = useRef<HTMLCanvasElement | null>(null);
  const userActionsCanvas = useRef<HTMLCanvasElement | null>(null);

  const isDragging = useRef<boolean>(false);
  const previousPosition = useRef<Point>({
    x: 0,
    y: 0
  });

  const tileSize = useMemo<Size>(() => {
    return {
      width: 0.5 * tileMagnification * BASE_TILE_SIZE,
      height: 0.25 * tileMagnification * BASE_TILE_SIZE
    };
  }, [tileMagnification]);

  const fullCanvasSize: Size = useMemo<Size>(() => {
    return {
      height: tileSize.height * (server!.configuration.mapSize + 2 + BORDER_SIZE),
      width: tileSize.width * (server!.configuration.mapSize + 2 + BORDER_SIZE)
    };
  }, [tileSize, server]);

  // Map will always be centered on currently selected village's coordinates
  const currentPosition = useRef<Point>({
    x: fullCanvasSize.width / 2,
    y: fullCanvasSize.height / 2
  });

  const canvasSize = useMemo<Size>(() => {
    return {
      width,
      height: navigationElement.current ? height - navigationElement.current.offsetHeight : height
    };
  }, [width, navigationElement, height]);

  // We draw the full map in to this offscreen canvas, then we'll take subsections of it and draw them on to the screen
  // TODO: Use 'OffscreenCanvas' only whenever Safari decides to implement it
  const offscreenCanvasContext = useMemo<HTMLCanvasElement>(() => {
    let offscreenCanvas: HTMLCanvasElement;

    // if ('OffscreenCanvas' in window) {
    //   offscreenCanvas = new OffscreenCanvas(fullCanvasSize.width, fullCanvasSize.height);
    // } else {
    //
    // }
    offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.height = fullCanvasSize.height;
    offscreenCanvas.width = fullCanvasSize.width;
    const offscreenContext = offscreenCanvas.getContext('2d')!;
    draw(tiles, offscreenContext, fullCanvasSize, tileSize);
    return offscreenCanvas;
  }, [fullCanvasSize, tileSize, tiles]);

  useEffect(() => {
    const backgroundCanvasRef = backgroundCanvas.current;
    const activeEffectsCanvasRef = activeEffectsCanvas.current;
    const userActionsCanvasRef = userActionsCanvas.current;

    if (!(tiles && backgroundCanvasRef && activeEffectsCanvasRef && userActionsCanvasRef)) {
      return;
    }

    const backgroundCanvasContext = backgroundCanvasRef.getContext('2d');
    const activeEffectsCanvasContext = activeEffectsCanvasRef.getContext('2d');
    const userActionsCanvasContext = userActionsCanvasRef.getContext('2d');

    const a = () => {
      const startingPositionCoordinates: Point = {
        x: currentPosition.current.x - canvasSize.width / 2,
        y: currentPosition.current.y - canvasSize.height / 2
      };

      // const startingBackgroundImage = offscreenCanvasContext.getImageData(
      //   startingPositionCoordinates.x,
      //   startingPositionCoordinates.y,
      //   canvasSize.width,
      //   canvasSize.height
      // );
      //
      backgroundCanvasContext!.drawImage(
        offscreenCanvasContext,
        startingPositionCoordinates.x,
        startingPositionCoordinates.y,
        canvasSize.width,
        canvasSize.height,
        0,
        0,
        canvasSize.width,
        canvasSize.height
      );
      backgroundCanvasContext!.stroke();
    };

    a();

    // const context: CanvasRenderingContext2D = canvasRef.getContext('2d')!;
    // draw(tiles, context, canvasSize, tileSize);

    const mouseDownHandler = (event: MouseEvent) => {
      isDragging.current = true;
      previousPosition.current = {
        x: event.clientX,
        y: event.clientY
      };
      event.preventDefault();
    };

    const mouseMoveHandler = (event: MouseEvent) => {
      // const columnWidth = 0.5 * tileSize;
      // const rowWidth = 0.25 * tileSize;
      //
      // const x = Math.floor((-mapMargins.current.x + event.clientX) / columnWidth);
      // const y = Math.floor((-mapMargins.current.y + event.clientY - navigationElement!.current!.offsetHeight) / rowWidth) + 100;
      // const isometric = cartesianToIsometric({
      //   x, y
      // });
      //
      // console.log(x - 100, 100 - y);

      // var dx = Math.abs(x - cellCenterX),
      //   dy = Math.abs(y - cellCenterY);
      //
      // if (dx / (cellWidth * 0.5) + dy / (cellHeight * 0.5) <= 1)

      // const mouse_grid_x = Math.floor((mouse_y / tile_height) + (mouse_x / tile_width));
      // const mouse_grid_y = Math.floor((-mouse_x / tile_width) + (mouse_y / tile_height));

      // console.log(mouse_grid_x, mouse_grid_y)

      // const mouse_grid_x = Math.floor((0.5 * event.offsetY / (tileSize.height)) + (event.offsetX / (tileSize.width)));
      // const mouse_grid_y = Math.floor((-event.offsetX / (tileSize.width)) + (event.offsetY / (tileSize.height)));
      //
      // console.log('x' + mouse_grid_x, 'y' + mouse_grid_y);

      if (isDragging.current) {
        // const horizontalDifference: Point['x'] = event.clientX - previousPosition.current.x;
        // const verticalDifference: Point['y'] = event.clientY - previousPosition.current.y;
        // previousPosition.current = {
        //   x: event.clientX,
        //   y: event.clientY
        // };
        //
        // let xMargin = mapMargins.current.x + horizontalDifference;
        // if (xMargin > canvasSize.width) {
        //   xMargin = canvasSize.width;
        // } else if (xMargin > 0) {
        //   xMargin = 0;
        // } else if (mapMargins.current.x - window.innerWidth < -canvasSize.width) {
        //   xMargin = -canvasSize.width + window.innerWidth;
        // }
        //
        // let yMargin = mapMargins.current.y + verticalDifference;
        // if (yMargin > canvasSize.height) {
        //   yMargin = canvasSize.height;
        // } else if (yMargin > 0) {
        //   yMargin = 0;
        // } else if (mapMargins.current.y - window.innerHeight < -canvasSize.height - tileMagnification) {
        //   yMargin = -canvasSize.height + window.innerHeight - tileMagnification;
        // }
        //
        // mapMargins.current.x = xMargin;
        // mapMargins.current.y = yMargin;
        // mapCenter.current = {
        //   x: xMargin,
        //   y: yMargin
        // };
        a();
        // canvas.current!.style.transform = `translate(${mapMargins.current.x}px, ${mapMargins.current.y}px)`;
      }
      event.preventDefault();
    };

    const mouseUpHandler = () => {
      isDragging.current = false;
    };

    // const wheelHandler = (event: WheelEvent) => {
    //   if (event.deltaY < 0) {
    //     if (tileMagnification === 50) {
    //       setTileMagnification(100);
    //     } else if (tileMagnification === 100) {
    //       setTileMagnification(150);
    //     }
    //   } else if (event.deltaY > 0) {
    //     if (tileMagnification === 150) {
    //       setTileMagnification(100);
    //     } else if (tileMagnification === 100) {
    //       setTileMagnification(50);
    //     }
    //   }
    // };

    userActionsCanvasRef.addEventListener('mousedown', mouseDownHandler, false);
    userActionsCanvasRef.addEventListener('mousemove', mouseMoveHandler, false);
    userActionsCanvasRef.addEventListener('mouseup', mouseUpHandler, false);
    // window.addEventListener('wheel', (event) => wheelHandler(event), false);

    return () => {
      userActionsCanvasRef.removeEventListener('mousedown', mouseDownHandler, false);
      userActionsCanvasRef.removeEventListener('mousemove', mouseMoveHandler, false);
      userActionsCanvasRef.removeEventListener('mouseup', mouseUpHandler, false);
      // window.removeEventListener('wheel', (event) => wheelHandler(event), false);
    };

    // tiles.forEach((tile: Tile, index: number) => {
    //   ctx?.fillRect(index * size, 0, size, size);
    // });
  }, [tiles, canvasSize, tileSize]);

  return (
    <div className="relative">
      <canvas
        className="absolute top-0 left-0 z-[0]"
        ref={backgroundCanvas}
        width={canvasSize.width}
        height={canvasSize.height}
      />
      <canvas
        className="absolute top-0 left-0 z-[1]"
        ref={activeEffectsCanvas}
        width={canvasSize.width}
        height={canvasSize.height}
      />
      <canvas
        className="absolute top-0 left-0 z-[2]"
        ref={userActionsCanvas}
        width={canvasSize.width}
        height={canvasSize.height}
      />
    </div>
  );
};
