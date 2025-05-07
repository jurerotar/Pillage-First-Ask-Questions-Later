import { Cell } from 'app/(game)/(village-slug)/(map)/components/cell';
import { MapControls } from 'app/(game)/(village-slug)/(map)/components/map-controls';
import { MapRulerCell } from 'app/(game)/(village-slug)/(map)/components/map-ruler-cell';
import { TileTooltip } from 'app/(game)/(village-slug)/(map)/components/tile-tooltip';
import { useMapFilters } from 'app/(game)/(village-slug)/(map)/hooks/use-map-filters';
import { MapContext, MapProvider } from 'app/(game)/(village-slug)/(map)/providers/map-context';
import { useMap } from 'app/(game)/(village-slug)/hooks/use-map';
import { usePlayers } from 'app/(game)/(village-slug)/hooks/use-players';
import { useReputations } from 'app/(game)/(village-slug)/hooks/use-reputations';
import { useVillages } from 'app/(game)/(village-slug)/hooks/use-villages';
import { Tooltip } from 'app/components/tooltip';
import { useDialog } from 'app/hooks/use-dialog';
import type { Point } from 'app/interfaces/models/common';
import type { Tile as TileType } from 'app/interfaces/models/game/tile';
import type { Village } from 'app/interfaces/models/game/village';
import { use, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { FixedSizeGrid, FixedSizeList } from 'react-window';
import { useEventListener } from 'usehooks-ts';
import { ViewportContext } from 'app/providers/viewport-context';
import { useWorldItems } from 'app/(game)/(village-slug)/hooks/use-world-items';
import type { WorldItem } from 'app/interfaces/models/game/world-item';
import { isStandaloneDisplayMode } from 'app/utils/device';
import { Dialog } from 'app/components/ui/dialog';
import { TileDialog } from 'app/(game)/(village-slug)/(map)/components/tile-modal';
import type { MetaFunction } from 'react-router';
import mapAssetsPreloadPaths from 'app/asset-preload-paths/map.json';
import { useEvents } from 'app/(game)/(village-slug)/hooks/use-events';
import { isTroopMovementEvent } from 'app/(game)/(village-slug)/hooks/guards/event-guards';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { usePlayerVillages } from 'app/(game)/(village-slug)/hooks/use-player-villages';

export const meta: MetaFunction = () => {
  const { files } = mapAssetsPreloadPaths;
  return files.map((href) => ({
    rel: 'preload',
    href,
    as: 'image',
    type: 'image/avif',
  }));
};

// Height/width of ruler on the left-bottom.
const RULER_SIZE = 20;

const MapPage = () => {
  const [searchParams] = useSearchParams();
  const { isOpen: isTileModalOpened, openModal, toggleModal, modalArgs } = useDialog<TileType | null>();
  const { map, getTileByTileId } = useMap();
  const { height, width, isWiderThanLg } = use(ViewportContext);
  const { mapFilters } = useMapFilters();
  const { gridSize, tileSize, magnification } = use(MapContext);
  const { playersMap } = usePlayers();
  const { reputationsMap } = useReputations();
  const { villages } = useVillages();
  const { worldItems } = useWorldItems();
  const { events } = useEvents();
  const { playerVillages } = usePlayerVillages();

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

  const tileIdToTroopMovementsMap = useMemo<Map<Village['id'], GameEvent<'troopMovement'>[]>>(() => {
    const troopMovementMap = new Map<Village['id'], GameEvent<'troopMovement'>[]>([]);

    for (const event of events) {
      if (!isTroopMovementEvent(event)) {
        continue;
      }

      if (!troopMovementMap.has(event.targetId)) {
        troopMovementMap.set(event.targetId, []);
      }

      const eventArray = troopMovementMap.get(event.targetId)!;
      eventArray.push(event);
    }

    return troopMovementMap;
  }, [events]);

  const fixedGridData = useMemo(() => {
    return {
      map,
      playersMap,
      reputationsMap,
      gridSize,
      mapFilters,
      magnification,
      tileIdToTroopMovementsMap,
      onClick: (tile: TileType) => {
        openModal(tile);
      },
      villageCoordinatesToWorldItemsMap,
      villageCoordinatesToVillagesMap,
      playerVillageIds: playerVillages.map(({ id }) => id),
    };
  }, [
    map,
    mapFilters,
    villageCoordinatesToWorldItemsMap,
    playersMap,
    reputationsMap,
    villageCoordinatesToVillagesMap,
    gridSize,
    magnification,
    openModal,
    tileIdToTroopMovementsMap,
    playerVillages,
  ]);

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

  const scrollLeft = (centerXTile: number) => {
    return tileSize * centerXTile + (tileSize * gridSize) / 2 - width / 2;
  };

  const scrollTop = (centerYTile: number) => {
    return (tileSize * gridSize) / 2 - tileSize * centerYTile - mapHeight / 2;
  };

  const offsetX = scrollLeft(currentCenterTile.current.x);
  const offsetY = scrollTop(currentCenterTile.current.y);

  return (
    <main className="relative overflow-x-hidden overflow-y-hidden scrollbar-hidden">
      <Dialog
        open={isTileModalOpened}
        onOpenChange={toggleModal}
      >
        <TileDialog tile={modalArgs.current} />
      </Dialog>
      <Tooltip
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
        key={tileSize}
        className="scrollbar-hidden bg-[#8EBF64] will-change-scroll"
        outerRef={mapRef}
        columnCount={gridSize}
        columnWidth={tileSize}
        rowCount={gridSize}
        rowHeight={tileSize}
        height={mapHeight - 1}
        width={width}
        itemData={fixedGridData}
        initialScrollLeft={offsetX}
        initialScrollTop={offsetY}
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
          className="scrollbar-hidden will-change-scroll"
          ref={leftMapRulerRef}
          itemSize={tileSize}
          height={mapHeight}
          itemCount={gridSize}
          width={RULER_SIZE}
          initialScrollOffset={offsetY}
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
          className="scrollbar-hidden will-change-scroll"
          ref={bottomMapRulerRef}
          itemSize={tileSize}
          height={RULER_SIZE}
          itemCount={gridSize}
          width={width - RULER_SIZE}
          initialScrollOffset={offsetX}
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
