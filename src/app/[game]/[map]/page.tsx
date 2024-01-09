import React, { useRef } from 'react';
import { useMap } from 'app/[game]/hooks/use-map';
import { FixedSizeGrid, FixedSizeList } from 'react-window';
import { useWindowSize } from 'usehooks-ts';
import { Tooltip } from 'app/components/tooltip';
import { useDialog } from 'app/hooks/use-dialog';
import { Modal } from 'app/components/modal';
import { Head } from 'app/components/head';
import { useMapFilters } from 'app/[game]/[map]/hooks/use-map-filters';
import { useMapOptions } from 'app/[game]/[map]/providers/map-context';
import { MapControls } from 'app/[game]/[map]/components/map-controls';
import { Cell } from 'app/[game]/[map]/components/cell';
import { TileTooltip } from 'app/[game]/[map]/components/tile-tooltip';
import { MapRulerCell } from 'app/[game]/[map]/components/map-ruler-cell';

export const MapPage: React.FC = () => {
  const {
    modalArgs,
    isOpen,
    openModal,
    closeModal
  } = useDialog();

  const {
    map,
    getTileByTileId
  } = useMap();
  const {
    height,
    width
  } = useWindowSize();
  const { shouldShowTileTooltips } = useMapFilters();
  const {
    gridSize,
    tileSize
  } = useMapOptions();

  const mapRef = useRef<HTMLDivElement>(null);
  const leftMapRulerRef = useRef<FixedSizeList>(null);
  const bottomMapRulerRef = useRef<FixedSizeList>(null);

  return (
    <>
      <Head viewName="map" />
      <Tooltip
        anchorSelect="[data-tile-id]"
        closeEvents={{
          mouseleave: true
        }}
        hidden={!shouldShowTileTooltips}
        render={({ activeAnchor }) => {
          const tileId = activeAnchor?.getAttribute('data-tile-id');

          if (!tileId) {
            return null;
          }

          const tile = getTileByTileId(tileId);

          return <TileTooltip tile={tile} />;
        }}
      />
      <Modal
        isOpen={isOpen}
        closeHandler={closeModal}
      >
        {null}
      </Modal>
      <FixedSizeGrid
        className="scrollbar-hidden mb-[20px] ml-[20px] bg-[#B9D580]"
        outerRef={mapRef}
        columnCount={gridSize}
        columnWidth={tileSize}
        rowCount={gridSize}
        rowHeight={tileSize}
        height={height - 20}
        width={width - 20}
        itemData={{
          map,
          openModal,
        }}
        initialScrollLeft={width / 2}
        initialScrollTop={height / 2}
        onScroll={({ scrollTop, scrollLeft }) => {
          if(bottomMapRulerRef.current) {
            bottomMapRulerRef.current.scrollTo(scrollLeft);
          }

          if(leftMapRulerRef.current) {
            leftMapRulerRef.current.scrollTo(scrollTop);
          }
        }}
      >
        {Cell}
      </FixedSizeGrid>
      {/* Y-axis ruler */}
      <div className="absolute left-0 top-0">
        <FixedSizeList
          className="scrollbar-hidden"
          ref={leftMapRulerRef}
          itemSize={tileSize}
          height={height - 20}
          itemCount={gridSize}
          width={20}
          layout="vertical"
          itemData={{
            layout: 'vertical'
          }}
        >
          {MapRulerCell}
        </FixedSizeList>
      </div>
      {/* X-axis ruler */}
      <div className="absolute bottom-0 left-0">
        <FixedSizeList
          className="scrollbar-hidden ml-[20px]"
          ref={bottomMapRulerRef}
          itemSize={tileSize}
          height={20}
          itemCount={gridSize}
          width={width - 20}
          layout="horizontal"
          itemData={{
            layout: 'horizontal'
          }}
        >
          {MapRulerCell}
        </FixedSizeList>
      </div>
      <MapControls />
    </>
  );
};
