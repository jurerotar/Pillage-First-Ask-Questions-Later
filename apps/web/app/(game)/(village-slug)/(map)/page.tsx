import { useWindowEvent } from '@mantine/hooks';
import {
  lazy,
  Suspense,
  type UIEvent,
  use,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useSearchParams } from 'react-router';
import type { ITooltip as ReactTooltipProps } from 'react-tooltip';
import {
  Grid,
  type GridImperativeAPI,
  List,
  type ListImperativeAPI,
} from 'react-window';
import type { Coordinates } from '@pillage-first/types/models/coordinates';
import type { Tile } from '@pillage-first/types/models/tile';
import type { Route } from '@react-router/types/app/(game)/(village-slug)/(map)/+types/page';
import { Cell } from 'app/(game)/(village-slug)/(map)/components/cell';
import { MapControls } from 'app/(game)/(village-slug)/(map)/components/map-controls';
import {
  MapRulerCell,
  MapRulerGridCell,
} from 'app/(game)/(village-slug)/(map)/components/map-ruler-cell';
import { useMapFilters } from 'app/(game)/(village-slug)/(map)/hooks/use-map-filters';
import { useMapMarkers } from 'app/(game)/(village-slug)/(map)/hooks/use-map-markers';
import {
  MapContext,
  MapProvider,
} from 'app/(game)/(village-slug)/(map)/providers/map-context';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';
import { useMap } from 'app/(game)/(village-slug)/hooks/use-map';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { useReputations } from 'app/(game)/(village-slug)/hooks/use-reputations';
import { PageContents } from 'app/components/page-contents';
import { Tooltip } from 'app/components/tooltip';
import { Dialog } from 'app/components/ui/dialog';
import { useDialog } from 'app/hooks/use-dialog';
import { useWindowSize } from 'app/hooks/use-window-size';
import { TileTooltip } from './components/tile-tooltip';

const TileDialog = lazy(async () => ({
  default: (
    await import('app/(game)/(village-slug)/(map)/components/tile-modal')
  ).TileDialog,
}));

// Height/width of ruler on the left-bottom.
const RULER_SIZE = 20;
const DRAG_CLICK_THRESHOLD = 3;

const MapPageContents = () => {
  const [searchParams] = useSearchParams();
  const {
    isOpen: isTileModalOpened,
    openModal,
    toggleModal,
    modalArgs,
  } = useDialog<Tile>();
  const { map } = useMap();
  const { height, width } = useWindowSize();
  const isWiderThanLg = useMediaQuery('(min-width: 1024px)');
  const { mapFilters } = useMapFilters();
  const { mapMarkers, createMapMarker, deleteMapMarker } = useMapMarkers();
  const { gridSize, tileSize, magnification } = use(MapContext);
  const { currentVillage } = useCurrentVillage();
  const location = useLocation();
  const { preferences } = usePreferences();
  const { getReputation } = useReputations();

  const { x, y } = currentVillage.coordinates;

  const startingX = Number.parseInt(searchParams.get('x') ?? `${x}`, 10);
  const startingY = Number.parseInt(searchParams.get('y') ?? `${y}`, 10);

  const [mapGrid, setMapGrid] = useState<GridImperativeAPI | null>(null);

  const [leftMapRuler, setLeftMapRuler] = useState<ListImperativeAPI | null>(
    null,
  );
  const [bottomMapRuler, setBottomMapRuler] =
    useState<GridImperativeAPI | null>(null);

  /**
   * List of individual contributions
   * Desktop:
   *  - Header is 80px tall
   * Mobile:
   *  - Top navigation is 128px tall
   *   - Navigation section is 63px tall
   *   - Resource section is 57px tall
   *  - Bottom navigation is 90px tall (108px in reality, but top 18px are transparent)
   *  - If app is opened in PWA mode, add another 48px to account for the space fill at the top
   */
  const mapHeight = isWiderThanLg ? height - 80 : height - 218;

  const isScrolling = useRef<boolean>(false);
  const [isDragScrolling, setIsDragScrolling] = useState<boolean>(false);
  const didDragScroll = useRef<boolean>(false);
  const dragScrollFrame = useRef<number | null>(null);
  const pendingDragScroll = useRef<Coordinates | null>(null);
  const currentCenterTile = useRef<Coordinates>({
    x: startingX,
    y: startingY,
  });
  const mouseDownPosition = useRef<Coordinates>({
    x: 0,
    y: 0,
  });

  const fixedGridData = useMemo(() => {
    return {
      map,
      gridSize,
      mapFilters,
      magnification,
      preferences,
      getReputation,
      mapMarkers,
      createMapMarker,
      deleteMapMarker,
      onClick: (tileId: number) => {
        if (didDragScroll.current) {
          didDragScroll.current = false;
          return;
        }

        const tile = map[tileId - 1];

        openModal(tile);
      },
    };
  }, [
    map,
    mapFilters,
    gridSize,
    magnification,
    openModal,
    preferences,
    getReputation,
    mapMarkers,
    createMapMarker,
    deleteMapMarker,
  ]);

  useEffect(() => {
    const node = mapGrid?.element;
    if (!node) {
      return;
    }

    const controller = new AbortController();

    const handleMouseDown = (event: MouseEvent) => {
      event.preventDefault();

      const { clientX, clientY } = event;

      mouseDownPosition.current = {
        x: clientX,
        y: clientY,
      };
      pendingDragScroll.current = null;
      didDragScroll.current = false;

      isScrolling.current = true;
      setIsDragScrolling(true);
    };

    node.addEventListener('mousedown', handleMouseDown, {
      signal: controller.signal,
      passive: false,
    });

    return () => {
      controller.abort();
    };
  }, [mapGrid]);

  useWindowEvent('mousemove', ({ clientX, clientY }) => {
    const node = mapGrid?.element;

    if (!isScrolling.current || !node) {
      return;
    }

    const deltaX = clientX - mouseDownPosition.current.x;
    const deltaY = clientY - mouseDownPosition.current.y;

    if (
      Math.abs(deltaX) > DRAG_CLICK_THRESHOLD ||
      Math.abs(deltaY) > DRAG_CLICK_THRESHOLD
    ) {
      didDragScroll.current = true;
    }

    mouseDownPosition.current = {
      x: clientX,
      y: clientY,
    };

    const currentScroll = pendingDragScroll.current ?? {
      x: node.scrollLeft,
      y: node.scrollTop,
    };

    pendingDragScroll.current = {
      x: currentScroll.x - deltaX,
      y: currentScroll.y - deltaY,
    };

    if (dragScrollFrame.current !== null) {
      return;
    }

    dragScrollFrame.current = window.requestAnimationFrame(() => {
      dragScrollFrame.current = null;

      const nextScroll = pendingDragScroll.current;
      if (!nextScroll) {
        return;
      }

      pendingDragScroll.current = null;
      node.scrollLeft = nextScroll.x;
      node.scrollTop = nextScroll.y;
      syncRulers(nextScroll.x, nextScroll.y);
    });
  });

  useWindowEvent('mouseup', () => {
    const node = mapGrid?.element;

    if (node && pendingDragScroll.current) {
      node.scrollLeft = pendingDragScroll.current.x;
      node.scrollTop = pendingDragScroll.current.y;
      syncRulers(pendingDragScroll.current.x, pendingDragScroll.current.y);
      pendingDragScroll.current = null;
    }

    if (dragScrollFrame.current !== null) {
      window.cancelAnimationFrame(dragScrollFrame.current);
      dragScrollFrame.current = null;
    }

    isScrolling.current = false;
    setIsDragScrolling(false);

    if (node) {
      updateCurrentCenterTile(node.scrollLeft, node.scrollTop);
    }
  });

  const scrollLeft = (tileX: number) => {
    return tileSize * (tileX + gridSize / 2) - width / 2;
  };

  const scrollTop = (tileY: number) => {
    return tileSize * (-tileY + gridSize / 2) - mapHeight / 2;
  };

  const offsetX = scrollLeft(currentCenterTile.current.x);
  const offsetY = scrollTop(currentCenterTile.current.y);

  const syncScroll = useCallback(
    (scrollX: number, scrollY: number, behavior: ScrollBehavior = 'auto') => {
      mapGrid?.element?.scrollTo({
        left: scrollX,
        top: scrollY,
        behavior,
      });
      leftMapRuler?.element?.scrollTo({
        top: scrollY,
        behavior,
      });
      bottomMapRuler?.element?.scrollTo({
        left: scrollX,
        behavior,
      });
    },
    [bottomMapRuler, leftMapRuler, mapGrid],
  );

  const syncRulers = useCallback(
    (scrollX: number, scrollY: number) => {
      bottomMapRuler?.element?.scrollTo({
        left: scrollX,
      });
      leftMapRuler?.element?.scrollTo({
        top: scrollY,
      });
    },
    [bottomMapRuler, leftMapRuler],
  );

  const updateCurrentCenterTile = useCallback(
    (scrollX: number, scrollY: number) => {
      currentCenterTile.current.x =
        (scrollX + width / 2) / tileSize - gridSize / 2;
      currentCenterTile.current.y =
        gridSize / 2 - (scrollY + mapHeight / 2) / tileSize;
    },
    [tileSize, gridSize, width, mapHeight],
  );

  const onScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollLeft } = event.currentTarget;

      if (isScrolling.current) {
        return;
      }

      syncRulers(scrollLeft, scrollTop);
      updateCurrentCenterTile(scrollLeft, scrollTop);
    },
    [syncRulers, updateCurrentCenterTile],
  );

  const isInitialRender = useRef<boolean>(true);

  useLayoutEffect(() => {
    syncScroll(offsetX, offsetY);
  }, [offsetX, offsetY, syncScroll]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: We intentionally only want to react on location.key and nothing else
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    const scrollX = scrollLeft(startingX);
    const scrollY = scrollTop(startingY);

    syncScroll(scrollX, scrollY, 'smooth');

    currentCenterTile.current = { x: startingX, y: startingY };
  }, [location.key]);

  const renderTooltip = useCallback(
    ({
      activeAnchor,
    }: Parameters<NonNullable<ReactTooltipProps['render']>>[0]) => {
      const tileIdAttr = activeAnchor?.getAttribute('data-tile-id');

      if (!tileIdAttr) {
        return null;
      }

      const tileId = Number.parseInt(tileIdAttr, 10);

      if (!tileId) {
        return null;
      }

      const tile = map[tileId - 1];
      const mapMarker = mapMarkers.find((marker) => marker.tileId === tileId);

      return (
        <Suspense fallback={null}>
          <TileTooltip
            mapMarker={mapMarker}
            tile={tile}
          />
        </Suspense>
      );
    },
    [map, mapMarkers],
  );

  return (
    <main className="relative overflow-x-hidden overflow-y-hidden scrollbar-hidden">
      <Dialog
        open={isTileModalOpened}
        onOpenChange={toggleModal}
      >
        <Suspense fallback={null}>
          <TileDialog
            createMapMarker={createMapMarker}
            deleteMapMarker={deleteMapMarker}
            mapMarkers={mapMarkers}
            tile={modalArgs.current!}
          />
        </Suspense>
      </Dialog>
      <Tooltip
        anchorSelect="[data-tile-id]"
        closeEvents={{
          mouseleave: true,
        }}
        hidden={
          !isWiderThanLg ||
          !mapFilters.shouldShowTileTooltips ||
          isTileModalOpened ||
          isDragScrolling
        }
        render={renderTooltip}
      />
      <Grid
        key={tileSize}
        className="scrollbar-hidden bg-[#8EBF64] will-change-scroll"
        gridRef={setMapGrid}
        columnCount={gridSize}
        columnWidth={tileSize}
        rowCount={gridSize}
        rowHeight={tileSize}
        style={{
          height: mapHeight,
          width,
        }}
        cellComponent={Cell}
        cellProps={fixedGridData}
        onScroll={onScroll}
        overscanCount={isDragScrolling ? 0 : 1}
      />
      {/* Y-axis ruler */}
      <div className="absolute left-0 top-0 non-selectable pointer-events-none">
        <List
          className="scrollbar-hidden will-change-scroll"
          listRef={setLeftMapRuler}
          rowHeight={tileSize}
          rowCount={gridSize}
          style={{
            height: mapHeight,
            width: RULER_SIZE,
          }}
          rowComponent={MapRulerCell}
          rowProps={{
            layout: 'vertical',
          }}
          overscanCount={1}
        />
      </div>
      {/* X-axis ruler */}
      <div className="absolute bottom-0 left-0 non-selectable pointer-events-none">
        <Grid
          className="scrollbar-hidden will-change-scroll"
          gridRef={setBottomMapRuler}
          columnWidth={tileSize}
          columnCount={gridSize}
          rowHeight={RULER_SIZE}
          rowCount={1}
          style={{
            height: RULER_SIZE,
            width: width - RULER_SIZE,
          }}
          cellComponent={MapRulerGridCell}
          cellProps={{
            layout: 'horizontal',
          }}
          overscanCount={1}
        />
      </div>
      <MapControls />
    </main>
  );
};

const MapPage = ({ params }: Route.ComponentProps) => {
  const { serverSlug, villageSlug } = params;

  const { t } = useTranslation();

  const title = `${t('Map')} | Pillage First! - ${serverSlug} - ${villageSlug}`;

  return (
    <PageContents>
      <title>{title}</title>
      <MapProvider>
        <MapPageContents />
      </MapProvider>
    </PageContents>
  );
};

export default MapPage;
