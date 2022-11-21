import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useWindowSize } from 'utils/hooks/use-window-size';
import { useOutletContext } from 'react-router-dom';
import { useContextSelector } from 'use-context-selector';
import { GameContext } from 'providers/game/game-context';
import { Point, Size } from 'interfaces/models/common';
import { Tile } from 'interfaces/models/game/tile';

type ContextType = {
  navigationElement: React.RefObject<HTMLElement>;
};

export const IsometricMap: React.FC = () => {
  const {
    width,
    height
  } = useWindowSize();
  const { navigationElement } = useOutletContext<ContextType>();
  const server = useContextSelector(GameContext, (v) => v.server);
  const tiles = useContextSelector(GameContext, (v) => v.tiles);

  const [tileMagnification, setTileMagnification] = useState<50 | 100 | 150>(100);

  const canvas = useRef<HTMLCanvasElement | null>(null);
  const isDragging = useRef<boolean>(false);
  const previousPosition = useRef<Point>({
    x: 0,
    y: 0
  });
  const mapMargins = useRef<Point>({
    x: 0,
    y: 0
  });

  const tileSize = useMemo<Size>(() => {
    return {
      width: 0.5 * tileMagnification,
      height: 0.25 * tileMagnification
    };
  }, [tileMagnification]);

  const canvasContainerSize = useMemo<Size>(() => {
    return {
      width,
      height: navigationElement.current ? height - navigationElement.current.offsetHeight : height
    };
  }, [width, height, navigationElement.current]);

  const canvasSize = useMemo<Size>(() => {
    return {
      width: tileSize.width * (server!.configuration.mapSize + 2),
      height: tileSize.height * (server!.configuration.mapSize + 2)
    };
  }, [tileSize]);

  const calculateTileOffset = (tile: Tile, canvasDimensions: Size, tileDimensions: Size): [number, number] => {
    return [
      ((tile.x - 1) * tileDimensions.width + tile.y * tileDimensions.width) + canvasDimensions.width / 2,
      -((tile.y + 1) * tileDimensions.height - tile.x * tileDimensions.height) + canvasDimensions.height / 2
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
    context.clearRect(0, 0, canvasSize.width, canvasSize.height);

    data.forEach((tile: Tile) => {
      context.strokeStyle = 'black';

      // Offsets determine starting position for each tile
      const [offsetX, offsetY] = calculateTileOffset(tile, canvasDimensions, tileDimensions);
      const [point1, point2, point3, point4] = calculateTilePoints(offsetX, offsetY, tileDimensions);

      context.fillStyle = tile.backgroundColor;

      const path = new Path2D(`M${point1.x},${point1.y} L${point2.x},${point2.y} L${point3.x},${point3.y} L${point4.x},${point4.y} Z`);
      context.fill(path);

      const textPosition: Point = {
        x: offsetX + tileSize.width - 15,
        y: offsetY + tileSize.height + 1
      };

      context.beginPath();
      context.font = '10px';
      context.strokeStyle = 'black';
      // context.strokeText(tile?.type ? `${tile.type}` : `(${tile.oasisGroup})`, textPosition.x, textPosition.y);
      context.strokeText(`(${tile.x}, ${tile.y})`, textPosition.x, textPosition.y);
      context.stroke();
      context.closePath();
    });
  };

  const outlineTile = (context: CanvasRenderingContext2D, tile: Tile, canvasDimensions: Size, tileDimensions: Size) => {
    const [offsetX, offsetY] = calculateTileOffset(tile, canvasDimensions, tileDimensions);
    const [point1, point2, point3, point4] = calculateTilePoints(offsetX, offsetY, tileDimensions);

    context.beginPath();
    context.moveTo(point1.x, point1.y);
    context.lineTo(point2.x, point2.y);
    context.moveTo(point2.x, point2.y);
    context.lineTo(point3.x, point3.y);
    context.moveTo(point3.x, point3.y);
    context.lineTo(point4.x, point4.y);
    context.moveTo(point4.x, point4.y);
    context.lineTo(point1.x, point1.y);
    context.stroke();
    context.closePath();
  };

  useEffect(() => {
    if (!(tiles && canvas.current)) {
      return;
    }
    const context: CanvasRenderingContext2D = canvas.current!.getContext('2d')!;
    draw(tiles, context, canvasSize, tileSize);

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
        const horizontalDifference: Point['x'] = event.clientX - previousPosition.current.x;
        const verticalDifference: Point['y'] = event.clientY - previousPosition.current.y;
        previousPosition.current = {
          x: event.clientX,
          y: event.clientY
        };

        let xMargin = mapMargins.current.x + horizontalDifference;
        if (xMargin > canvasSize.width) {
          xMargin = canvasSize.width;
        } else if (xMargin > 0) {
          xMargin = 0;
        } else if (mapMargins.current.x - window.innerWidth < -canvasSize.width) {
          xMargin = -canvasSize.width + window.innerWidth;
        }

        let yMargin = mapMargins.current.y + verticalDifference;
        if (yMargin > canvasSize.height) {
          yMargin = canvasSize.height;
        } else if (yMargin > 0) {
          yMargin = 0;
        } else if (mapMargins.current.y - window.innerHeight < -canvasSize.height - tileMagnification) {
          yMargin = -canvasSize.height + window.innerHeight - tileMagnification;
        }

        mapMargins.current.x = xMargin;
        mapMargins.current.y = yMargin;
        canvas.current!.style.transform = `translate(${mapMargins.current.x}px, ${mapMargins.current.y}px)`;
      }
      event.preventDefault();
    };

    const mouseUpHandler = () => {
      isDragging.current = false;
    };

    const wheelHandler = (event: WheelEvent) => {
      if (event.deltaY < 0) {
        if (tileMagnification === 50) {
          setTileMagnification(100);
        } else if (tileMagnification === 100) {
          setTileMagnification(150);
        }
      } else if (event.deltaY > 0) {
        if (tileMagnification === 150) {
          setTileMagnification(100);
        } else if (tileMagnification === 100) {
          setTileMagnification(50);
        }
      }
    };

    canvas.current?.addEventListener('mousedown', (event) => mouseDownHandler(event), false);
    window.addEventListener('mousemove', (event) => mouseMoveHandler(event), false);
    window.addEventListener('mouseup', () => mouseUpHandler(), false);
    window.addEventListener('wheel', (event) => wheelHandler(event), false);

    return () => {
      canvas.current?.removeEventListener('mousedown', (event) => mouseDownHandler(event), false);
      window.removeEventListener('mousemove', (event) => mouseMoveHandler(event), false);
      window.removeEventListener('mouseup', () => mouseUpHandler(), false);
      window.removeEventListener('wheel', (event) => wheelHandler(event), false);
    };

    // tiles.forEach((tile: Tile, index: number) => {
    //   ctx?.fillRect(index * size, 0, size, size);
    // });
  }, [tiles, canvasContainerSize, tileSize]);

  useEffect(() => {

  }, [width, height]);

  return (
    <div
      className="relative overflow-hidden"
      style={{
        height: canvasContainerSize.height,
        width: canvasContainerSize.width
      }}
    >
      <canvas
        className="absolute top-0 left-0"
        ref={canvas}
        width={canvasSize.width}
        height={canvasSize.height}
      />
    </div>
  );
};
