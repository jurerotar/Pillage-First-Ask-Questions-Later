import { Cell } from 'app/(game)/(map)/components/cell';
import { MapControls } from 'app/(game)/(map)/components/map-controls';
import { MapRulerCell } from 'app/(game)/(map)/components/map-ruler-cell';
import { TileModal } from 'app/(game)/(map)/components/tile-modal';
import { TileTooltip } from 'app/(game)/(map)/components/tile-tooltip';
import { useMapFilters } from 'app/(game)/(map)/hooks/use-map-filters';
import { MapContext, MapProvider } from 'app/(game)/(map)/providers/map-context';
import { useMap } from 'app/(game)/hooks/use-map';
import { usePlayers } from 'app/(game)/hooks/use-players';
import { useReputations } from 'app/(game)/hooks/use-reputations';
import { useVillages } from 'app/(game)/hooks/use-villages';
import { isOccupiedOccupiableTile } from 'app/(game)/utils/guards/map-guards';
import { Tooltip } from 'app/components/tooltip';
import { useDialog } from 'app/hooks/use-dialog';
import type { Point } from 'app/interfaces/models/common';
import type { OccupiedOccupiableTile, Tile as TileType } from 'app/interfaces/models/game/tile';
import type { Village } from 'app/interfaces/models/game/village';
import { use, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { FixedSizeGrid, FixedSizeList } from 'react-window';
import { useEventListener } from 'usehooks-ts';
import { ViewportContext } from 'app/providers/viewport-context';
import { useWorldItems } from 'app/(game)/hooks/use-world-items';
import type { WorldItem } from 'app/interfaces/models/game/world-item';
import { isStandaloneDisplayMode } from 'app/utils/device';

// Height/width of ruler on the left-bottom.
const RULER_SIZE = 20;

const MapPage = () => {
  const { isOpen: isTileModalOpened, closeModal, openModal, modalArgs } = useDialog<TileType>();
  const { map, getTileByTileId } = useMap();
  const { height, width, isWiderThanLg } = use(ViewportContext);
  const { mapFilters } = useMapFilters();
  const { gridSize, tileSize, magnification } = use(MapContext);
  const { getPlayerByPlayerId } = usePlayers();
  const { getReputationByFaction } = useReputations();
  const [searchParams] = useSearchParams();
  const { villages } = useVillages();
  const { worldItems } = useWorldItems();

  const [rerenderCount, setRerenderCount] = useState<number>(0);

  const startingX = Number.parseInt(searchParams.get('x') ?? '0');
  const startingY = Number.parseInt(searchParams.get('y') ?? '0');

  const mapRef = useRef<HTMLDivElement>(null);
  const leftMapRulerRef = useRef<FixedSizeList>(null);
  const bottomMapRulerRef = useRef<FixedSizeList>(null);

  const isPwa = isStandaloneDisplayMode();

  /**
   * List of individual contributions
   * Desktop:
   *  - Header is 76px tall
   * Mobile:
   *  - Top navigation is 120px tall
   *   - Navigation section is 63px tall
   *   - Resource section is 57px tall
   *  - Bottom navigation is 90px tall (108px in reality, but top 18px are transparent)
   *  - If app is opened in PWA mode, add another 48px to account for the space fill at the top
   */
  const mapHeight = isWiderThanLg ? height - 76 : height - 210 + (isPwa ? 48 : 0);

  const previousTileSize = useRef<number>(tileSize);
  const isScrolling = useRef<boolean>(false);
  const currentCenterTile = useRef<Point>({
    x: startingX,
    y: startingY,
  });
  const mouseDownPosition = useRef<Point>({
    x: 0,
    y: 0,
  });

  // Fun fact, using any kind of hooks in rendered tiles absolutely hammers performance.
  // We need to get all tile information in here and pass it down as props
  const tilesWithFactions = useMemo(() => {
    return map.map((tile: TileType) => {
      const isOccupiedOccupiableCell = isOccupiedOccupiableTile(tile);

      if (isOccupiedOccupiableCell) {
        const { faction, tribe } = getPlayerByPlayerId((tile as OccupiedOccupiableTile).ownedBy);
        const reputationLevel = getReputationByFaction(faction)?.reputationLevel;

        return {
          ...tile,
          faction,
          reputationLevel,
          tribe,
        };
      }

      return tile;
    });
  }, [map, getReputationByFaction, getPlayerByPlayerId]);

  const villageCoordinatesToVillagesMap = useMemo<Map<Village['id'], Village>>(() => {
    return new Map<Village['id'], Village>(
      villages.map((village) => {
        return [village.id, village];
      }),
    );
  }, [villages]);

  const villageCoordinatesToWorldItemsMap = useMemo<Map<Village['id'], WorldItem>>(() => {
    return new Map<Village['id'], WorldItem>(
      worldItems.map((worldItem) => {
        return [worldItem.tileId, worldItem];
      }),
    );
  }, [worldItems]);

  const fixedGridData = useMemo(() => {
    return {
      tilesWithFactions,
      mapFilters,
      magnification,
      onClick: openModal,
      villageCoordinatesToVillagesMap,
      villageCoordinatesToWorldItemsMap,
    };
  }, [tilesWithFactions, mapFilters, magnification, openModal, villageCoordinatesToVillagesMap, villageCoordinatesToWorldItemsMap]);

  useEventListener(
    'mousedown',
    ({ clientX, clientY }) => {
      mouseDownPosition.current = {
        x: clientX,
        y: clientY,
      };

      isScrolling.current = true;
    },
    // @ts-expect-error - remove once usehooks-ts is R19 compliant
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
    // @ts-expect-error - remove once usehooks-ts is R19 compliant
    mapRef,
  );

  useEventListener(
    'mouseup',
    () => {
      isScrolling.current = false;
    },
    // @ts-expect-error - remove once usehooks-ts is R19 compliant
    mapRef,
  );

  useEventListener(
    'mouseleave',
    () => {
      isScrolling.current = false;
    },
    // @ts-expect-error - remove once usehooks-ts is R19 compliant
    mapRef,
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: We actually need tileSize, we just use it in currentCenterTile calculation
  useLayoutEffect(() => {
    if (!mapRef.current || !bottomMapRulerRef.current || !leftMapRulerRef.current) {
      return;
    }

    const scrollLeft = (centerXTile: number) => {
      return tileSize * centerXTile + (tileSize * gridSize) / 2 - width / 2;
    };

    const scrollTop = (centerYTile: number) => {
      return (tileSize * gridSize) / 2 - tileSize * centerYTile - mapHeight / 2;
    };

    if (previousTileSize.current !== tileSize) {
      const offsetX = scrollLeft(currentCenterTile.current.x);
      const offsetY = scrollTop(currentCenterTile.current.y);

      mapRef.current.scrollTo({
        top: offsetY,
        left: offsetX,
      });

      bottomMapRulerRef.current.scrollTo(offsetX);
      leftMapRulerRef.current.scrollTo(offsetY);

      previousTileSize.current = tileSize;
      return;
    }

    const offsetX = scrollLeft(startingX);
    const offsetY = scrollTop(startingY);

    mapRef.current.scrollTo({
      top: offsetY,
      left: offsetX,
    });

    bottomMapRulerRef.current.scrollTo(offsetX);
    leftMapRulerRef.current.scrollTo(offsetY);
  }, [tileSize]);

  // We need this due to this bug: https://github.com/ReactTooltip/react-tooltip/issues/1189
  useEffect(() => {
    if (rerenderCount >= 3) {
      return;
    }
    setRerenderCount((prevState) => prevState + 1);
  }, [rerenderCount]);

  return (
    <main className="relative overflow-x-hidden overflow-y-hidden scrollbar-hidden">
      <Tooltip
        key={rerenderCount}
        anchorSelect="[data-tile-id]"
        closeEvents={{
          mouseleave: true,
        }}
        hidden={!mapFilters.shouldShowTileTooltips || isTileModalOpened}
        render={({ activeAnchor }) => {
          const tileId = activeAnchor?.getAttribute('data-tile-id');

          if (!tileId) {
            return null;
          }

          const tile = getTileByTileId(tileId as TileType['id']);

          return <TileTooltip tile={tile} />;
        }}
      />
      {isTileModalOpened && (
        <TileModal
          tile={modalArgs.current!}
          onClose={closeModal}
        />
      )}
      <FixedSizeGrid
        className="scrollbar-hidden bg-[#8EBF64]"
        outerRef={mapRef}
        columnCount={gridSize}
        columnWidth={tileSize}
        rowCount={gridSize}
        rowHeight={tileSize}
        height={mapHeight - 1}
        width={width}
        itemData={fixedGridData}
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

          // Zoom completely breaks the centering, so we use this to manually keep track of the center tile and manually scroll to it on zoom
          currentCenterTile.current.x = Math.floor((scrollLeft + (width - tileSize) / 2) / tileSize - gridSize / 2);
          currentCenterTile.current.y = Math.ceil((scrollTop + (mapHeight - tileSize) / 2) / tileSize - gridSize / 2);
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
          height={mapHeight}
          itemCount={gridSize}
          width={RULER_SIZE}
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
    </main>
  );
};

export default () => {
  return (
    <MapProvider>
      <MapPage />
    </MapProvider>
  );
};
