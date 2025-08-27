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
    openModal,
    toggleModal,
    modalArgs,
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

  const [leftMapRulerRef, setLeftMapRulerRef] = useGridCallbackRef(null);
  const [bottomMapRulerRef, setBottomMapRulerRef] = useGridCallbackRef(null);
  const [mapRef, setMapRef] = useGridCallbackRef(null);

  const isPwa = isStandaloneDisplayMode();

  /**
   * List of individual contributions
   * Desktop:
   *  - Header is 76px tall
   * Mobile:
   *  - Top navigation is 128px tall
   *   - Navigation section is 63px tall
   *   - Resource section is 57px tall
   *  - Bottom navigation is 90px tall (108px in reality, but top 18px are transparent)
   *  - If app is opened in PWA mode, add another 48px to account for the space fill at the top
   */
  const mapHeight = isWiderThanLg
    ? height - 76
    : height - 218 - (isPwa ? 48 : 0);

  const isScrolling = useRef<boolean>(false);
  const currentCenterTile = useRef<Point>({
    x: startingX,
    y: startingY,
  });
  const mouseDownPosition = useRef<Point>({
    x: 0,
    y: 0,
  });

  const fixedGridData = useMemo(() => {
    return {
      contextualMap,
      gridSize,
      mapFilters,
      magnification,
      preferences,
      onClick: (tile: TileType) => {
        openModal(tile);
      },
    };
  }, [
    contextualMap,
    mapFilters,
    gridSize,
    magnification,
    openModal,
    preferences,
  ]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: We need to re-attach handlers on tile-size change, because map remounts
  useEffect(() => {
    const node = mapRef?.element;
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

      isScrolling.current = true;
    };

    node.addEventListener('mousedown', handleMouseDown, {
      signal: controller.signal,
      passive: false,
    });

    return () => {
      controller.abort();
    };
  }, [mapRef, tileSize]);

  useEventListener(
    'mousemove',
    (e: MouseEvent) => {
      if (!isScrolling.current || !mapRef) {
        return;
      }

      const { clientX, clientY } = e;

      const deltaX = clientX - mouseDownPosition.current.x;
      const deltaY = clientY - mouseDownPosition.current.y;

      mouseDownPosition.current = { x: clientX, y: clientY };

      const el = mapRef.element;
      if (!el) {
        return;
      }

      const currentColumn = Math.round(el.scrollLeft / tileSize);
      const currentRow = Math.round(el.scrollTop / tileSize);

      const deltaColumns = Math.round(deltaX / tileSize);
      const deltaRows = Math.round(deltaY / tileSize);

      mapRef.scrollToCell({
        columnIndex: currentColumn - deltaColumns,
        rowIndex: currentRow - deltaRows,
        columnAlign: 'start',
        rowAlign: 'start',
        behavior: 'instant',
      });
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

  const isInitialRender = useRef<boolean>(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: We intentionally only want to react on location.key and nothing else
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    const scrollX = scrollLeftPx(startingX);
    const scrollY = scrollTopPx(startingY);

    const colIndex = Math.round(scrollX / tileSize);
    const rowIndex = Math.round(scrollY / tileSize);

    if (mapRef) {
      mapRef.scrollToCell({
        columnIndex: colIndex,
        rowIndex,
        columnAlign: 'start',
        rowAlign: 'start',
        behavior: 'smooth',
      });
    }

    if (leftMapRulerRef) {
      leftMapRulerRef.scrollToRow({
        index: rowIndex,
        align: 'start',
        behavior: 'smooth',
      });
    }

    if (bottomMapRulerRef) {
      bottomMapRulerRef.scrollToColumn({
        index: colIndex,
        align: 'start',
        behavior: 'smooth',
      });
    }

    currentCenterTile.current = { x: startingX, y: startingY };
  }, [location.key]);

  const renderTooltip = useCallback(
    ({
      activeAnchor,
    }: Parameters<NonNullable<ReactTooltipProps['render']>>[0]) => {
      const tileId = activeAnchor?.getAttribute('data-tile-id');

      if (!tileId) {
        return null;
      }

      const tile = getTileByTileId(Number.parseInt(tileId, 10));
      return <TileTooltip tile={tile} />;
    },
    [getTileByTileId],
  );

  return (
    <main className="relative overflow-x-hidden overflow-y-hidden scrollbar-hidden">
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
      <Grid<CellProps>
        key={tileSize}
        className="scrollbar-hidden bg-[#8EBF64] will-change-scroll"
        gridRef={setMapRef}
        columnCount={gridSize}
        columnWidth={tileSize}
        rowCount={gridSize}
        rowHeight={tileSize}
        // @ts-expect-error
        cellProps={fixedGridData}
        cellComponent={Cell}
      />
      {/* Y-axis ruler */}
      <div className="absolute left-0 top-0 select-none pointer-events-none">
        <Grid<MapRulerCellProps>
          className="scrollbar-hidden w-[20px]"
          gridRef={setLeftMapRulerRef}
          columnCount={1}
          columnWidth={20}
          rowCount={gridSize}
          rowHeight={tileSize}
          cellProps={{
            layout: 'vertical',
          }}
          cellComponent={MapRulerCell}
        />
      </div>
      {/* X-axis ruler */}
      <div className="absolute bottom-0 left-0 select-none pointer-events-none">
        <Grid<MapRulerCellProps>
          className="scrollbar-hidden"
          gridRef={setBottomMapRulerRef}
          columnCount={gridSize}
          columnWidth={tileSize}
          rowCount={1}
          rowHeight={20}
          cellProps={{
            layout: 'horizontal',
          }}
          cellComponent={MapRulerCell}
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
