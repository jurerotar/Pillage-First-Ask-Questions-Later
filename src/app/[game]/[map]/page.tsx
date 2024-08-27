import { Cell } from 'app/[game]/[map]/components/cell';
import { MapControls } from 'app/[game]/[map]/components/map-controls';
import { MapRulerCell } from 'app/[game]/[map]/components/map-ruler-cell';
import { TileTooltip } from 'app/[game]/[map]/components/tile-tooltip';
import { useMapFilters } from 'app/[game]/[map]/hooks/use-map-filters';
import { useMapOptions } from 'app/[game]/[map]/providers/map-context';
import { useCurrentServer } from 'app/[game]/hooks/use-current-server';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { useMap } from 'app/[game]/hooks/use-map';
import { usePlayers } from 'app/[game]/hooks/use-players';
import { useReputations } from 'app/[game]/hooks/use-reputations';
import { useVillages } from 'app/[game]/hooks/use-villages';
import { isOccupiedOasisTile, isOccupiedOccupiableTile } from 'app/[game]/utils/guards/map-guards';
import { Modal } from 'app/components/modal';
import { Tooltip } from 'app/components/tooltip';
import { useDialog } from 'app/hooks/use-dialog';
import { useViewport } from 'app/providers/viewport-context';
import type { OccupiedOccupiableTile, Tile as TileType } from 'interfaces/models/game/tile';
import type React from 'react';
import { useMemo, useRef } from 'react';
import { FixedSizeGrid, FixedSizeList } from 'react-window';
import { useEventListener } from 'usehooks-ts';

// Height/width of ruler on the left-bottom
const RULER_SIZE = 20;

// TODO: Scroll out/in map zoom event handling
// TODO: Zooming out should keep current tile centered
// TODO: Tiles should be smaller on mobile

export const MapPage: React.FC = () => {
  const { isOpen, closeModal } = useDialog();

  const {
    server: { configuration },
  } = useCurrentServer();
  const { map, getTileByTileId } = useMap();
  const { height, width, isWiderThanLg } = useViewport();
  const { mapFilters } = useMapFilters();
  const { gridSize, tileSize, magnification } = useMapOptions();
  const {
    currentVillage: { coordinates },
  } = useCurrentVillage();
  const { getPlayerByPlayerId } = usePlayers();
  const { getReputationByFaction } = useReputations();
  const { getPlayerByOasis } = useVillages();

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
      const isOccupiedOccupiableCell = isOccupiedOccupiableTile(tile);
      const isOccupiedOasisCell = isOccupiedOasisTile(tile);

      if (isOccupiedOccupiableCell) {
        const { faction } = getPlayerByPlayerId((tile as OccupiedOccupiableTile).ownedBy);
        const reputationLevel = getReputationByFaction(faction)?.reputationLevel;

        return {
          ...tile,
          faction,
          reputationLevel,
        };
      }

      if (isOccupiedOasisCell) {
        const playerId = getPlayerByOasis(tile);
        const { faction } = getPlayerByPlayerId(playerId);
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
  }, [map, getReputationByFaction, getPlayerByPlayerId, getPlayerByOasis]);

  const fixedGridData = useMemo(() => {
    return {
      tilesWithFactions,
      mapFilters,
      magnification,
    };
  }, [tilesWithFactions, mapFilters, magnification]);

  useEventListener(
    'mousedown',
    ({ clientX, clientY }) => {
      mouseDownPosition.current = {
        x: clientX,
        y: clientY,
      };

      isScrolling.current = true;
    },
    mapRef,
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
    mapRef,
  );

  useEventListener(
    'mouseup',
    () => {
      isScrolling.current = false;
    },
    mapRef,
  );

  useEventListener(
    'mouseleave',
    () => {
      isScrolling.current = false;
    },
    mapRef,
  );

  const initialScrollTop = tileSize * (configuration.mapSize / 2 + coordinates.y) - (height - tileSize) / 2;
  const initialScrollLeft = tileSize * (configuration.mapSize / 2 + coordinates.x) - (width - tileSize) / 2;

  return (
    <div className="relative">
      <Tooltip
        anchorSelect="[data-tile-id]"
        closeEvents={{
          mouseleave: true,
        }}
        hidden={!mapFilters.shouldShowTileTooltips || !isWiderThanLg}
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
        className="scrollbar-hidden bg-[#8EBF64]"
        outerRef={mapRef}
        columnCount={gridSize}
        columnWidth={tileSize}
        rowCount={gridSize}
        rowHeight={tileSize}
        height={height}
        width={width}
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
      <div className="absolute left-0 top-0">
        <FixedSizeList
          className="scrollbar-hidden"
          ref={leftMapRulerRef}
          itemSize={tileSize}
          height={height - RULER_SIZE}
          itemCount={gridSize}
          width={RULER_SIZE}
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
      <div className="absolute bottom-0 left-0">
        <FixedSizeList
          className="scrollbar-hidden"
          ref={bottomMapRulerRef}
          itemSize={tileSize}
          height={RULER_SIZE}
          itemCount={gridSize}
          initialScrollOffset={initialScrollLeft}
          width={width - RULER_SIZE}
          layout="horizontal"
          itemData={{
            layout: 'horizontal',
          }}
        >
          {MapRulerCell}
        </FixedSizeList>
      </div>
      <MapControls />
    </div>
  );
};
