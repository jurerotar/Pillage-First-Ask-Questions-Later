import React, { useRef } from 'react';
import { useMap } from 'hooks/game/use-map';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { FixedSizeGrid } from 'react-window';
import { useEventListener, useWindowSize } from 'usehooks-ts';
import { Cell } from 'app/(game)/map/components/cell';
import { useCurrentVillage } from 'hooks/game/use-current-village';
import { useMapOptions } from 'app/(game)/map/providers/map-context';
import { MapControls } from 'app/(game)/map/components/map-controls';
import { Tooltip } from 'components/tooltip';
import { Point } from 'interfaces/models/common';

const TILE_BASE_SIZE = 30;

const onMouseMoveHandler = (e: MouseEvent, isDragging: boolean) => {
  if (!isDragging) {
    return;
  }
  const [startX, startY] = [e.screenX, e.screenY];
};

export const MapPage: React.FC = () => {
  const {
    map,
  } = useMap();

  const {
    server,
  } = useCurrentServer();

  const {
    height,
    width,
  } = useWindowSize();

  const { currentVillage } = useCurrentVillage();
  const { coordinates } = currentVillage;
  const { magnification, mapFilters: { shouldShowTileTooltips } } = useMapOptions();

  const mapSize = server?.configuration?.mapSize;

  const tileSize = TILE_BASE_SIZE * magnification;
  const gridSize = mapSize! + 1;

  const mapRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);
  const currentPosition = useRef<Point>({
    x: 0,
    y: 0,
  });

  useEventListener('mousedown', () => {
    isDragging.current = true;
  }, mapRef);

  useEventListener('mouseup', () => {
    isDragging.current = false;
  }, mapRef);

  useEventListener('mousemove', (event: MouseEvent) => onMouseMoveHandler(event, isDragging.current), mapRef);

  return (
    <>
      <Tooltip
        id="map-page-id"
        anchorSelect={'[id^="tile-id-"]'}
        place="top"
        closeEvents={{
          mouseleave: true,
        }}
        hidden={!shouldShowTileTooltips}
      />
      <FixedSizeGrid
        useIsScrolling
        style={{
          backgroundColor: '#B9D580',
        }}
        initialScrollTop={coordinates.y * tileSize}
        initialScrollLeft={coordinates.x * tileSize}
        outerRef={mapRef}
        columnCount={gridSize}
        columnWidth={tileSize}
        rowCount={gridSize}
        rowHeight={tileSize}
        height={height}
        width={width}
        itemData={map}
        overscanColumnCount={5}
        overscanRowCount={5}
      >
        {Cell}
      </FixedSizeGrid>
      <MapControls />
    </>
  );
};
