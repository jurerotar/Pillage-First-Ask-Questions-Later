import { Cell } from 'app/(game)/(village-slug)/(map)/components/cell';
import { MapControls } from 'app/(game)/(village-slug)/(map)/components/map-controls';
import { MapRulerCell } from 'app/(game)/(village-slug)/(map)/components/map-ruler-cell';
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
import type React from 'react';
import { useSearchParams } from 'react-router';
import { Grid, useGridRef } from 'react-window';
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

// Height/width of ruler on the left-bottom.
const RULER_SIZE = 20;

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
  const { preferences } = usePreferences();

  const { x, y } = currentVillage.coordinates;

  const startingX = Number.parseInt(searchParams.get('x') ?? `${x}`, 10);
  const startingY = Number.parseInt(searchParams.get('y') ?? `${y}`, 10);

  const leftMapRulerRef = useGridRef(null);
  const bottomMapRulerRef = useGridRef(null);
  const gridRef = useGridRef(null);

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
  // When dragging the map, we don't want clicks to open the tile modal.
  const hasDragged = useRef<boolean>(false);
  const currentCenterTile = useRef<Point>({
    x: startingX,
    y: startingY,
  });
  const mouseDownPosition = useRef<Point>({
    x: 0,
    y: 0,
  });
  // Preserve the initial mouse down position to compute total movement distance
  const mouseDownStartPosition = useRef<Point>({
    x: 0,
    y: 0,
  });

  const DRAG_THRESHOLD_PX = 8;

  const fixedGridData = useMemo(() => {
    return {
      contextualMap,
      gridSize,
      mapFilters,
      magnification,
      preferences,
      onClick: (tile: TileType) => {
        // Ignore clicks that were preceded by a drag gesture
        if (hasDragged.current) {
          return;
        }
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

  // Event listeners need to be reattached when Grid remounts (which happens when the Grid DOM element changes)
  useEffect(() => {
    const attachEventListeners = () => {
      const gridElement = gridRef.current?.element;

      if (!gridElement) {
        // If element is not ready yet, try again on next frame
        requestAnimationFrame(attachEventListeners);
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
        mouseDownStartPosition.current = {
          x: clientX,
          y: clientY,
        };

        hasDragged.current = false;
        isScrolling.current = true;
      };

      gridElement.addEventListener('mousedown', handleMouseDown, {
        signal: controller.signal,
        passive: false,
      });

      return () => {
        controller.abort();
      };
    };

    return attachEventListeners();
  }, [gridRef.current?.element]);

  useEventListener(
    'mousemove',
    (event: MouseEvent) => {
      const { clientX, clientY } = event;
      if (!isScrolling.current || !gridRef.current?.element) {
        return;
      }

      const deltaX = clientX - mouseDownPosition.current.x;
      const deltaY = clientY - mouseDownPosition.current.y;

      // Compute total movement since the interaction started
      const totalDeltaX = clientX - mouseDownStartPosition.current.x;
      const totalDeltaY = clientY - mouseDownStartPosition.current.y;
      if (
        !hasDragged.current &&
        (Math.abs(totalDeltaX) > DRAG_THRESHOLD_PX ||
          Math.abs(totalDeltaY) > DRAG_THRESHOLD_PX)
      ) {
        hasDragged.current = true;
      }

      const currentX = gridRef.current.element.scrollLeft;
      const currentY = gridRef.current.element.scrollTop;

      mouseDownPosition.current = {
        x: clientX,
        y: clientY,
      };

      gridRef.current.element.scrollTo({
        left: currentX - deltaX,
        top: currentY - deltaY,
        behavior: 'auto',
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

  const scrollLeft = useCallback(
    (tileX: number) => {
      return tileSize * (tileX + gridSize / 2) - width / 2;
    },
    [tileSize, gridSize, width],
  );

  const scrollTop = useCallback(
    (tileY: number) => {
      return tileSize * (-tileY + gridSize / 2) - mapHeight / 2;
    },
    [tileSize, gridSize, mapHeight],
  );

  const scrollToPosition = useCallback(
    (scrollX: number, scrollY: number) => {
      if (gridRef.current?.element) {
        gridRef.current.element.scrollTo({
          left: scrollX,
          top: scrollY,
          behavior: 'auto',
        });
      }

      if (leftMapRulerRef.current?.element) {
        leftMapRulerRef.current.element.scrollTo({ top: scrollY });
      }

      if (bottomMapRulerRef.current?.element) {
        bottomMapRulerRef.current.element.scrollTo({ left: scrollX });
      }
    },
    [gridRef, leftMapRulerRef, bottomMapRulerRef],
  );

  const scrollToPositionSmooth = useCallback(
    (scrollX: number, scrollY: number) => {
      if (gridRef.current?.element) {
        gridRef.current.element.scrollTo({
          left: scrollX,
          top: scrollY,
          behavior: 'smooth',
        });
      }

      if (leftMapRulerRef.current?.element) {
        leftMapRulerRef.current.element.scrollTo({ top: scrollY });
      }

      if (bottomMapRulerRef.current?.element) {
        bottomMapRulerRef.current.element.scrollTo({ left: scrollX });
      }
    },
    [gridRef, leftMapRulerRef, bottomMapRulerRef],
  );

  const onScroll = useCallback(
    ({ target }: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollLeft } = target as HTMLDivElement;
      if (bottomMapRulerRef.current?.element) {
        bottomMapRulerRef.current.element.scrollTo({ left: scrollLeft });
      }
      if (leftMapRulerRef.current?.element) {
        leftMapRulerRef.current.element.scrollTo({ top: scrollTop });
      }

      currentCenterTile.current.x = Math.round(
        (scrollLeft + width / 2) / tileSize - gridSize / 2,
      );
      currentCenterTile.current.y = Math.round(
        gridSize / 2 - (scrollTop + mapHeight / 2) / tileSize,
      );
    },
    [tileSize, gridSize, width, mapHeight, bottomMapRulerRef, leftMapRulerRef],
  );

  const isInitialRender = useRef<boolean>(true);
  const previousTileSize = useRef<number>(tileSize);

  useEffect(() => {
    if (isInitialRender.current || previousTileSize.current === tileSize) {
      return;
    }

    const scrollX = scrollLeft(currentCenterTile.current.x);
    const scrollY = scrollTop(currentCenterTile.current.y);

    requestAnimationFrame(() => {
      scrollToPosition(scrollX, scrollY);
    });

    previousTileSize.current = tileSize;
  }, [tileSize, scrollLeft, scrollTop, scrollToPosition]);

  useEffect(() => {
    if (!isInitialRender.current) {
      return;
    }

    const scrollX = scrollLeft(currentCenterTile.current.x);
    const scrollY = scrollTop(currentCenterTile.current.y);

    requestAnimationFrame(() => {
      scrollToPosition(scrollX, scrollY);
    });
  }, [scrollLeft, scrollTop, scrollToPosition]);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    const scrollX = scrollLeft(startingX);
    const scrollY = scrollTop(startingY);

    scrollToPositionSmooth(scrollX, scrollY);

    currentCenterTile.current = { x: startingX, y: startingY };
  }, [scrollLeft, scrollTop, startingX, startingY, scrollToPositionSmooth]);

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
      <Grid
        key={tileSize}
        className="scrollbar-hidden bg-[#8EBF64] will-change-scroll"
        gridRef={gridRef}
        columnCount={gridSize}
        columnWidth={tileSize}
        rowCount={gridSize}
        rowHeight={tileSize}
        style={{ height: mapHeight, width }}
        cellProps={fixedGridData}
        onScroll={onScroll}
        cellComponent={Cell}
      />
      {/* Y-axis ruler */}
      <div className="absolute left-0 top-0 select-none pointer-events-none">
        <Grid
          className="scrollbar-hidden will-change-scroll"
          gridRef={leftMapRulerRef}
          columnCount={1}
          rowCount={gridSize}
          columnWidth={RULER_SIZE}
          rowHeight={tileSize}
          style={{ height: mapHeight, width: RULER_SIZE }}
          cellComponent={MapRulerCell}
          cellProps={{ layout: 'vertical' }}
        />
      </div>
      {/* X-axis ruler */}
      <div className="absolute bottom-0 left-0 select-none pointer-events-none">
        <Grid
          className="scrollbar-hidden will-change-scroll"
          gridRef={bottomMapRulerRef}
          columnCount={gridSize}
          columnWidth={tileSize}
          rowCount={1}
          rowHeight={RULER_SIZE}
          style={{ height: RULER_SIZE, width }}
          cellComponent={MapRulerCell}
          cellProps={{ layout: 'horizontal' }}
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
