import React, { useMemo, useRef, useState } from 'react';
import { useMap } from 'hooks/game/use-map';
import { useCurrentServer } from 'hooks/game/use-current-server';
import { FixedSizeGrid } from 'react-window';
import { useEventListener, useWindowSize } from 'usehooks-ts';
import { useCurrentVillage } from 'hooks/game/use-current-village';
import { Tooltip } from 'components/tooltip';
import { Point } from 'interfaces/models/common';
import { useDialog } from 'hooks/utils/use-dialog';
import { Modal } from 'components/modal/modal';
import { useMapFilters } from 'hooks/game/use-map-filters';
import { Head } from 'components/head';
import { useMapOptions } from './providers/map-context';
import { MapControls } from './components/map-controls';
import { Cell } from './components/cell';
import { TileTooltip } from './components/tile-tooltip';

const TILE_BASE_SIZE = 30;

const onMouseMoveHandler = (e: MouseEvent, isDragging: boolean) => {
  if (!isDragging) {
    return;
  }
  const [startX, startY] = [e.screenX, e.screenY];
};

export const MapPage: React.FC = () => {
  const { isOpen, openModal, closeModal } = useDialog();

  const {
    map,
    getTileByTileId,
  } = useMap();

  const {
    server,
  } = useCurrentServer();

  const {
    height,
    width,
  } = useWindowSize();

  const { currentVillage } = useCurrentVillage();
  const { mapFilters: { shouldShowTileTooltips } } = useMapFilters();
  const { magnification } = useMapOptions();

  const [modalContents, setModalContents] = useState<React.ReactNode>(null);

  const mapSize = server?.configuration?.mapSize;

  const tileSize = TILE_BASE_SIZE * magnification;
  const gridSize = mapSize! + 1;

  const mapRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);
  const currentPosition = useRef<Point>({
    x: 0,
    y: 0,
  });

  const itemData = useMemo(() => {
    return {
      map
    };
  }, [map]);

  useEventListener('mousedown', () => {
    isDragging.current = true;
  }, mapRef);

  useEventListener('mouseup', () => {
    isDragging.current = false;
  }, mapRef);

  useEventListener('mousemove', (event: MouseEvent) => onMouseMoveHandler(event, isDragging.current), mapRef);

  return (
    <>
      <Head
        viewName="map"
        tFunctionArgs={{
          currentVillageName: currentVillage.name
        }}
      />
      <Tooltip
        id="map-page-id"
        anchorSelect={'[id^="tile-id-"]'}
        place="top"
        closeEvents={{
          mouseleave: true,
        }}
        hidden={!shouldShowTileTooltips}
        render={({ activeAnchor }) => {
          const tileId = activeAnchor?.getAttribute('id')?.replace('tile-id-', '');

          if (!tileId) {
            return null;
          }

          const tile = getTileByTileId(tileId);

          return (
            <TileTooltip tile={tile} />
          );
        }}
      />
      <Modal
        isOpen={isOpen}
        closeHandler={() => {
          setModalContents(() => null);
          closeModal();
        }}
      >
        {modalContents}
      </Modal>
      <FixedSizeGrid
        className="bg-[#B9D580]"
        outerRef={mapRef}
        columnCount={gridSize}
        columnWidth={tileSize}
        rowCount={gridSize}
        rowHeight={tileSize}
        height={height}
        width={width}
        itemData={itemData}
      >
        {Cell}
      </FixedSizeGrid>
      <MapControls />
    </>
  );
};