import React, { useMemo, useRef } from 'react';
import { useMap } from 'app/[game]/hooks/use-map';
import { FixedSizeGrid, FixedSizeList } from 'react-window';
import { useEventListener, useWindowSize } from 'usehooks-ts';
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
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { useCurrentServer } from 'app/[game]/hooks/use-current-server';
import { OccupiedOccupiableTile, Tile as TileType } from 'interfaces/models/game/tile';
import { usePlayers } from 'app/[game]/hooks/use-players';
import { useReputations } from 'app/[game]/hooks/use-reputations';

export const MapPage: React.FC = () => {
  const { isOpen, closeModal } = useDialog();

  const {
    server: { configuration },
  } = useCurrentServer();
  const { map, getTileByTileId } = useMap();
  const { height, width } = useWindowSize();
  const { mapFilters } = useMapFilters();
  const { gridSize, tileSize } = useMapOptions();
  const {
    currentVillage: { coordinates },
  } = useCurrentVillage();
  const { players, getPlayerByPlayerId } = usePlayers();
  const { reputations, getReputationByFaction } = useReputations();

  const mapRef = useRef<HTMLDivElement>(null);
  const leftMapRulerRef = useRef<FixedSizeList>(null);
  const bottomMapRulerRef = useRef<FixedSizeList>(null);

  const isScrolling = useRef<boolean>(false);
  const mouseDownPosition = useRef({
    x: 0,
    y: 0,
  });

  // Fun fact, using any kind of hooks in rendered tiles absolutely hammers performance.
  // We need to get all tile information in here and pass it down as props
  const tilesWithFactions = useMemo(() => {
    return map.map((tile: TileType) => {
      const isOccupiedOccupiableTile = tile.type === 'free-tile' && Object.hasOwn(tile, 'ownedBy');

      if (isOccupiedOccupiableTile) {
        const { faction } = getPlayerByPlayerId((tile as OccupiedOccupiableTile).ownedBy);
        const reputationLevel = getReputationByFaction(faction)?.reputationLevel;

        return {
          ...tile,
          faction,
          reputationLevel,
        };
      }

      return {
        ...tile,
      };
    });
    // This is intentional, missing functions don't have stable reference
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, players, reputations]);

  const fixedGridData = useMemo(() => {
    return {
      tilesWithFactions,
      mapFilters,
    };
  }, [tilesWithFactions, mapFilters]);

  useEventListener(
    'mousedown',
    ({ clientX, clientY }) => {
      mouseDownPosition.current = {
        x: clientX,
        y: clientY,
      };

      isScrolling.current = true;
    },
    mapRef
  );

  useEventListener(
    'mousemove',
    ({ clientX, clientY }) => {
      if (!isScrolling.current || !mapRef.current) {
        return;
      }

      const deltaX = clientX - mouseDownPosition.current.x;
      const deltaY = clientY - mouseDownPosition.current.y;

      const currentX = mapRef.current.scrollLeft;
      const currentY = mapRef.current.scrollTop;

      mouseDownPosition.current = {
        x: clientX,
        y: clientY,
      };

      mapRef.current.scrollTo(currentX - deltaX, currentY - deltaY);
    },
    mapRef
  );

  useEventListener(
    'mouseup',
    () => {
      isScrolling.current = false;
    },
    mapRef
  );

  const initialScrollTop = tileSize * (configuration.mapSize / 2 + coordinates.y) - (height - tileSize) / 2;
  const initialScrollLeft = tileSize * (configuration.mapSize / 2 + coordinates.x) - (width - tileSize) / 2;

  return (
    <>
      <Head viewName="map" />
      <Tooltip
        anchorSelect="[data-tile-id]"
        closeEvents={{
          mouseleave: true,
        }}
        hidden={!mapFilters.shouldShowTileTooltips}
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
        itemData={fixedGridData}
        initialScrollTop={initialScrollTop}
        initialScrollLeft={initialScrollLeft}
        itemKey={({ columnIndex, data, rowIndex }) => {
          const size = Math.sqrt(data.tilesWithFactions.length);
          const tile: TileType = map[size * rowIndex + columnIndex];
          return tile.id;
        }}
        onScroll={({ scrollTop, scrollLeft }) => {
          if (bottomMapRulerRef.current) {
            bottomMapRulerRef.current.scrollTo(scrollLeft);
          }

          if (leftMapRulerRef.current) {
            leftMapRulerRef.current.scrollTo(scrollTop);
          }
        }}
      >
        {Cell}
      </FixedSizeGrid>
      {/* Y-axis ruler */}
      <div className="absolute left-0 top-0 bg-slate-800">
        <FixedSizeList
          className="scrollbar-hidden"
          ref={leftMapRulerRef}
          itemSize={tileSize}
          height={height - 20}
          itemCount={gridSize}
          width={20}
          initialScrollOffset={initialScrollTop}
          layout="vertical"
          itemData={{
            layout: 'vertical',
          }}
        >
          {MapRulerCell}
        </FixedSizeList>
      </div>
      {/* X-axis ruler */}
      <div className="absolute bottom-0 left-0 bg-slate-800">
        <FixedSizeList
          className="scrollbar-hidden ml-[20px]"
          ref={bottomMapRulerRef}
          itemSize={tileSize}
          height={20}
          itemCount={gridSize}
          initialScrollOffset={initialScrollLeft}
          width={width - 20}
          layout="horizontal"
          itemData={{
            layout: 'horizontal',
          }}
        >
          {MapRulerCell}
        </FixedSizeList>
      </div>
      <MapControls />
    </>
  );
};
