import { Cell, type TileWithClasses } from 'app/(game)/(village-slug)/(map)/components/cell';
import { MapControls } from 'app/(game)/(village-slug)/(map)/components/map-controls';
import { MapRulerCell } from 'app/(game)/(village-slug)/(map)/components/map-ruler-cell';
import { TileTooltip } from 'app/(game)/(village-slug)/(map)/components/tile-tooltip';
import { useMapFilters } from 'app/(game)/(village-slug)/(map)/hooks/use-map-filters';
import { MapContext, MapProvider } from 'app/(game)/(village-slug)/(map)/providers/map-context';
import { useMap } from 'app/(game)/(village-slug)/hooks/use-map';
import { usePlayers } from 'app/(game)/(village-slug)/hooks/use-players';
import { useReputations } from 'app/(game)/(village-slug)/hooks/use-reputations';
import { useVillages } from 'app/(game)/(village-slug)/hooks/use-villages';
import { isOccupiedOccupiableTile, isUnoccupiedOccupiableTile } from 'app/(game)/(village-slug)/utils/guards/map-guards';
import { Tooltip } from 'app/components/tooltip';
import { useDialog } from 'app/hooks/use-dialog';
import type { Point } from 'app/interfaces/models/common';
import type { OasisTile, Tile as TileType } from 'app/interfaces/models/game/tile';
import type { Village, VillageSize } from 'app/interfaces/models/game/village';
import { use, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { FixedSizeGrid, FixedSizeList } from 'react-window';
import { useEventListener } from 'usehooks-ts';
import { ViewportContext } from 'app/providers/viewport-context';
import { useWorldItems } from 'app/(game)/(village-slug)/hooks/use-world-items';
import type { WorldItem } from 'app/interfaces/models/game/world-item';
import { isStandaloneDisplayMode } from 'app/utils/device';
import { parseCoordinatesFromTileId, parseOasisTileGraphicsProperty } from 'app/utils/map-tile';
import clsx from 'clsx';
import { calculatePopulationFromBuildingFields } from 'app/(game)/(village-slug)/utils/building';
import cellStyles from 'app/(game)/(village-slug)/(map)/components/cell.module.scss';

// Height/width of ruler on the left-bottom.
const RULER_SIZE = 20;

const populationToVillageSizeMap = new Map<number, VillageSize>([
  [500, 'xl'],
  [250, 'md'],
  [100, 'sm'],
]);

const getVillageSize = (population: number): VillageSize => {
  for (const [key, size] of populationToVillageSizeMap) {
    if (population >= key) {
      return size;
    }
  }

  return 'xs';
};

const MapPage = () => {
  const [searchParams] = useSearchParams();
  const { isOpen: isTileModalOpened } = useDialog<TileType>();
  const { map, getTileByTileId } = useMap();
  const { height, width, isWiderThanLg } = use(ViewportContext);
  const { mapFilters } = useMapFilters();
  const { gridSize, tileSize } = use(MapContext);
  const { playersMap } = usePlayers();
  const { reputationsMap } = useReputations();
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
  const mapHeight = isWiderThanLg ? height - 76 : height - 210 - (isPwa ? 48 : 0);

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

  // Fun fact, using any kind of hooks in rendered tiles absolutely hammers performance.
  // We need to get all tile information in here and pass it down as props
  const tilesWithClasses = useMemo<TileWithClasses[]>(() => {
    return map.map((tile: TileType) => {
      if (isUnoccupiedOccupiableTile(tile)) {
        const { RFC } = tile;

        return {
          ...tile,
          tileClasses: clsx(cellStyles['cell-static-styles'], cellStyles['unoccupied-tile'], cellStyles[`unoccupied-tile-${RFC}`]),
        };
      }

      if (isOccupiedOccupiableTile(tile)) {
        const { faction, tribe } = playersMap.get(tile.ownedBy)!;
        const { reputationLevel } = reputationsMap.get(faction)!;
        const { x, y } = parseCoordinatesFromTileId(tile.id);
        const { buildingFields, buildingFieldsPresets } = villageCoordinatesToVillagesMap.get(`${x}|${y}`)!;

        const population = calculatePopulationFromBuildingFields(buildingFields!, buildingFieldsPresets);

        const villageSize = getVillageSize(population);

        return {
          ...tile,
          tileClasses: clsx(
            reputationLevel,
            cellStyles['cell-static-styles'],
            cellStyles['occupied-tile'],
            cellStyles[`occupied-tile-${tribe}`],
            cellStyles[`occupied-tile-${tribe}-${villageSize}`],
            cellStyles[`occupied-tile-${villageSize}`],
          ),
        }
      }

      const { oasisResource, oasisGroup, groupPositions, oasisVariant } = parseOasisTileGraphicsProperty((tile as OasisTile).graphics);

      return {
        ...tile,
        tileClasses: clsx(
          cellStyles['cell-static-styles'],
          cellStyles.oasis,
          cellStyles[`oasis-${oasisResource}`],
          cellStyles[`oasis-${oasisResource}-group-${oasisGroup}`],
          cellStyles[`oasis-${oasisResource}-group-${oasisGroup}-position-${groupPositions}`],
          cellStyles[`oasis-${oasisResource}-group-${oasisGroup}-position-${groupPositions}-variant-${oasisVariant}`],
        ),
      };
    });
  }, [map]);

  const fixedGridData = useMemo(() => {
    return {
      tilesWithClasses,
      gridSize,
      mapFilters,
      onClick: () => {
      },
      villageCoordinatesToWorldItemsMap,
    };
  }, [tilesWithClasses, mapFilters, villageCoordinatesToWorldItemsMap]);

  useEventListener(
    'mousedown',
    (event) => {
      event.preventDefault();
      const { clientX, clientY } = event;

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
    window,
  );

  useEventListener(
    'mouseup',
    () => {
      isScrolling.current = false;
    },
    // @ts-expect-error - remove once usehooks-ts is R19 compliant
    window,
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
        itemKey={({ columnIndex, rowIndex }) => {
          const tile: TileType = map[gridSize * rowIndex + columnIndex];
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
      <div className="absolute left-0 top-0 select-none pointer-events-none">
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
      <div className="absolute bottom-0 left-0 select-none pointer-events-none">
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
