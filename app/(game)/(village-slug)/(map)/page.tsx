import {
  Cell,
  type CellProps,
} from 'app/(game)/(village-slug)/(map)/components/cell';
import { MapControls } from 'app/(game)/(village-slug)/(map)/components/map-controls';
import {
  MapRulerCell,
  type MapRulerCellProps,
} from 'app/(game)/(village-slug)/(map)/components/map-ruler-cell';
import { TileTooltip } from 'app/(game)/(village-slug)/(map)/components/tile-tooltip';
import { useMapFilters } from 'app/(game)/(village-slug)/(map)/hooks/use-map-filters';
import {
  MapContext,
  MapProvider,
} from 'app/(game)/(village-slug)/(map)/providers/map-context';
import { useMap } from 'app/(game)/(village-slug)/hooks/use-map';
import { Tooltip } from 'app/components/tooltip';
import { useDialog } from 'app/hooks/use-dialog';
import type { Point } from 'app/interfaces/models/common';
import type { Tile as TileType } from 'app/interfaces/models/game/tile';
import { Suspense, use, useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router';
import { useSearchParams } from 'react-router';
import { Grid, useGridCallbackRef } from 'react-window';
import { useEventListener, useWindowSize } from 'usehooks-ts';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';
import { isStandaloneDisplayMode } from 'app/utils/device';
import { Dialog } from 'app/components/ui/dialog';
import { TileDialog } from 'app/(game)/(village-slug)/(map)/components/tile-modal';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import type { Route } from '.react-router/types/app/(game)/(village-slug)/(map)/+types/page';
import { useTranslation } from 'react-i18next';
import type { ITooltip as ReactTooltipProps } from 'react-tooltip';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';

const MapPage = () => {
  const [searchParams] = useSearchParams();
  const {
    isOpen: isTileModalOpened,
    toggleModal,
    modalArgs,
    openModal,
  } = useDialog<TileType | null>();
  const { contextualMap, getTileByTileId } = useMap();
  const { height, width } = useWindowSize({ debounceDelay: 150 });
  const isWiderThanLg = useMediaQuery('(min-width: 1024px)');
  const { mapFilters } = useMapFilters();
  const { gridSize, tileSize, magnification } = use(MapContext);
  const { currentVillage } = useCurrentVillage();
  const location = useLocation();
  const { preferences } = usePreferences();

  const { x, y } = currentVillage.coordinates;
  const startingX = Number.parseInt(searchParams.get('x') ?? `${x}`, 10);
  const startingY = Number.parseInt(searchParams.get('y') ?? `${y}`, 10);

  const [yAxisRulerRef, setYAxisRulerRef] = useGridCallbackRef(null);
  const [xAxisRulerRef, setXAxisRulerRef] = useGridCallbackRef(null);
  const [mapRef, setMapRef] = useGridCallbackRef(null);

  const isPwa = isStandaloneDisplayMode();
  const mapHeight = isWiderThanLg
    ? height - 76
    : height - 218 - (isPwa ? 48 : 0);

  const isDragging = useRef<boolean>(false);
  const startMouse = useRef<Point>({ x: 0, y: 0 });
  const startScroll = useRef<{ left: number; top: number }>({
    left: 0,
    top: 0,
  });

  const currentCenterTile = useRef<Point>({ x: startingX, y: startingY });

  const fixedGridData = useMemo(
    () => ({
      contextualMap,
      gridSize,
      mapFilters,
      magnification,
      preferences,
      onClick: (tile: TileType) => openModal(tile),
    }),
    [
      contextualMap,
      mapFilters,
      gridSize,
      magnification,
      openModal,
      preferences,
    ],
  );

  // Attach mousedown to the map grid's outer element
  useEffect(() => {
    const el = mapRef?.element;
    if (!el) {
      return;
    }

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) {
        return;
      }
      e.preventDefault();
      isDragging.current = true;
      startMouse.current = { x: e.clientX, y: e.clientY };
      startScroll.current = { left: el.scrollLeft, top: el.scrollTop };
    };

    el.addEventListener('mousedown', onMouseDown, { passive: false });
    return () => {
      el.removeEventListener('mousedown', onMouseDown);
    };
  }, [mapRef, tileSize]);

  // Drag move on window for robustness
  useEventListener(
    'mousemove',
    (e: MouseEvent) => {
      const map = mapRef?.element;

      if (!isDragging.current || !map) {
        return;
      }

      const dx = e.clientX - startMouse.current.x;
      const dy = e.clientY - startMouse.current.y;

      const maxLeft = map.scrollWidth - map.clientWidth;
      const maxTop = map.scrollHeight - map.clientHeight;
      const nextLeft = Math.max(
        0,
        Math.min(startScroll.current.left - dx, maxLeft),
      );
      const nextTop = Math.max(
        0,
        Math.min(startScroll.current.top - dy, maxTop),
      );

      // scroll map
      // eslint-disable-next-line react-compiler/react-compiler
      map.scrollLeft = nextLeft;
      map.scrollTop = nextTop;

      // mirror to rulers
      const xEl = xAxisRulerRef?.element;
      const yEl = yAxisRulerRef?.element;
      if (xEl) {
        xEl.scrollLeft = nextLeft;
      }
      if (yEl) {
        yEl.scrollTop = nextTop;
      }
    },
    // @ts-expect-error - remove once usehooks-ts is R19 compliant
    window,
  );

  // End drag
  useEventListener(
    'mouseup',
    () => {
      if (!isDragging.current) {
        return;
      }
      isDragging.current = false;
      const el = mapRef?.element;
      if (el) {
        el.style.cursor = '';
      }
    },
    // @ts-expect-error - remove once usehooks-ts is R19 compliant
    window,
  );

  // Helpers for initial scroll positions
  const columnIndexForTile = (tileX: number) =>
    Math.round(tileX + gridSize / 2 - width / (2 * tileSize));
  const rowIndexForTile = (tileY: number) =>
    Math.round(-tileY + gridSize / 2 - mapHeight / (2 * tileSize));
  const scrollLeftPx = (tileX: number) =>
    tileSize * (tileX + gridSize / 2) - width / 2;
  const scrollTopPx = (tileY: number) =>
    tileSize * (-tileY + gridSize / 2) - mapHeight / 2;

  const _initialColumnIndex = columnIndexForTile(currentCenterTile.current.x);
  const _initialRowIndex = rowIndexForTile(currentCenterTile.current.y);

  const isInitialRender = useRef(true);

  // React to URL changes (smooth center)
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    const scrollX = scrollLeftPx(startingX);
    const scrollY = scrollTopPx(startingY);
    const colIndex = Math.round(scrollX / tileSize);
    const rowIndex = Math.round(scrollY / tileSize);

    mapRef?.scrollToCell({
      columnIndex: colIndex,
      rowIndex,
      columnAlign: 'start',
      rowAlign: 'start',
      behavior: 'smooth',
    });
    yAxisRulerRef?.scrollToRow({
      index: rowIndex,
      align: 'start',
      behavior: 'smooth',
    });
    xAxisRulerRef?.scrollToColumn({
      index: colIndex,
      align: 'start',
      behavior: 'smooth',
    });

    currentCenterTile.current = { x: startingX, y: startingY };
  }, [
    location.key,
    mapRef,
    xAxisRulerRef,
    yAxisRulerRef,
    startingX,
    startingY,
    tileSize,
  ]);

  const renderTooltip = useCallback(
    ({
      activeAnchor,
    }: Parameters<NonNullable<ReactTooltipProps['render']>>[0]) => {
      const tileId = activeAnchor?.getAttribute('data-tile-id');
      if (!tileId) return null;
      const tile = getTileByTileId(Number.parseInt(tileId, 10));
      return <TileTooltip tile={tile} />;
    },
    [getTileByTileId],
  );

  return (
    <main className="relative">
      <Dialog
        open={isTileModalOpened}
        onOpenChange={toggleModal}
      >
        <Suspense fallback={null}>
          <TileDialog tile={modalArgs.current} />
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
          isTileModalOpened
        }
        render={renderTooltip}
      />
      <div
        className="bg-[#8EBF64] relative"
        style={{ height: `${mapHeight}px`, width: `${width}px` }}
      >
        <Grid<CellProps>
          key={tileSize}
          className="scrollbar-hidden cursor-grab"
          gridRef={setMapRef}
          columnCount={gridSize}
          columnWidth={tileSize}
          rowCount={gridSize}
          rowHeight={tileSize}
          overscanCount={0}
          // @ts-expect-error
          cellProps={fixedGridData}
          cellComponent={Cell}
        />

        {/* Y-axis ruler */}
        <Grid<MapRulerCellProps>
          className="scrollbar-hidden w-[20px] absolute left-0 top-0 select-none pointer-events-none"
          gridRef={setYAxisRulerRef}
          columnCount={1}
          columnWidth={20}
          rowCount={gridSize}
          rowHeight={tileSize}
          cellProps={{ layout: 'vertical' }}
          cellComponent={MapRulerCell}
          onResize={() => {
            yAxisRulerRef?.scrollToCell({
              rowIndex: _initialRowIndex,
              columnIndex: 0,
              behavior: 'instant',
            });
          }}
        />

        {/* X-axis ruler */}
        <Grid<MapRulerCellProps>
          className="scrollbar-hidden absolute bottom-0 left-0 select-none pointer-events-none"
          gridRef={setXAxisRulerRef}
          columnCount={gridSize}
          columnWidth={tileSize}
          rowCount={1}
          rowHeight={20}
          cellProps={{ layout: 'horizontal' }}
          cellComponent={MapRulerCell}
          onResize={() => {
            xAxisRulerRef?.scrollToCell({
              rowIndex: 0,
              columnIndex: _initialColumnIndex,
              behavior: 'instant',
            });
          }}
        />
      </div>

      <MapControls />
    </main>
  );
};

export default ({ params }: Route.ComponentProps) => {
  const { serverSlug, villageSlug } = params;
  const { t } = useTranslation();
  const title = `${t('Map')} | Pillage First! - ${serverSlug} - ${villageSlug}`;

  return (
    <>
      <title>{title}</title>
      <MapProvider>
        <MapPage />
      </MapProvider>
    </>
  );
};
