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
import { useLocation } from 'react-router';
import { useSearchParams } from 'react-router';
import {
  FixedSizeGrid,
  FixedSizeList,
  type GridOnScrollProps,
} from 'react-window';
import { useEventListener, useWindowSize } from 'usehooks-ts';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';
import { isStandaloneDisplayMode } from 'app/utils/device';
import { Dialog } from 'app/components/ui/dialog';
import { TileDialog } from 'app/(game)/(village-slug)/(map)/components/tile-modal';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import type { Route } from '.react-router/types/app/(game)/(village-slug)/(map)/+types/page';
import { useTranslation } from 'react-i18next';
import type { ITooltip as ReactTooltipProps } from 'react-tooltip';

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
  const location = useLocation();

  const { x, y } = currentVillage.coordinates;

  const startingX = Number.parseInt(searchParams.get('x') ?? `${x}`);
  const startingY = Number.parseInt(searchParams.get('y') ?? `${y}`);

  const mapRef = useRef<HTMLDivElement>(null);

  const setMapRef = useCallback((node: HTMLDivElement | null) => {
    mapRef.current = node;
  }, []);

  const leftMapRulerRef = useRef<FixedSizeList>(null);
  const bottomMapRulerRef = useRef<FixedSizeList>(null);

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
      onClick: (tile: TileType) => {
        openModal(tile);
      },
    };
  }, [contextualMap, mapFilters, gridSize, magnification, openModal]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: We need to re-attach handlers on tile-size change, because map remounts
  useEffect(() => {
    const node = mapRef.current;
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
  }, [mapRef.current, tileSize]);

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

  const scrollLeft = (tileX: number) => {
    return tileSize * (tileX + gridSize / 2) - width / 2;
  };

  const scrollTop = (tileY: number) => {
    return tileSize * (-tileY + gridSize / 2) - mapHeight / 2;
  };

  const offsetX = scrollLeft(currentCenterTile.current.x);
  const offsetY = scrollTop(currentCenterTile.current.y);

  const onScroll = useCallback(
    ({ scrollTop, scrollLeft }: GridOnScrollProps) => {
      if (bottomMapRulerRef.current) {
        bottomMapRulerRef.current.scrollTo(scrollLeft);
      }

      if (leftMapRulerRef.current) {
        leftMapRulerRef.current.scrollTo(scrollTop);
      }

      // Zoom completely breaks the centering, so we use this to manually keep track of the center tile and manually scroll to it on zoom
      currentCenterTile.current.x =
        Math.floor(
          (scrollLeft + (width - tileSize) / 2) / tileSize - gridSize / 2,
        ) + 1;
      currentCenterTile.current.y = Math.ceil(
        (scrollTop + (mapHeight - tileSize) / 2) / tileSize - gridSize / 2,
      );
    },
    [tileSize, gridSize, width, mapHeight],
  );

  const isInitialRender = useRef<boolean>(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: We intentionally only want to react on location.key and nothing else
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    const scrollX = scrollLeft(startingX);
    const scrollY = scrollTop(startingY);

    if (mapRef.current) {
      mapRef.current.scrollTo({
        left: scrollX,
        top: scrollY,
        behavior: 'smooth',
      });
    }

    if (leftMapRulerRef.current) {
      leftMapRulerRef.current.scrollTo(scrollY);
    }

    if (bottomMapRulerRef.current) {
      bottomMapRulerRef.current.scrollTo(scrollX);
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

      const tile = getTileByTileId(Number.parseInt(tileId));
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
      <FixedSizeGrid
        key={tileSize}
        className="scrollbar-hidden bg-[#8EBF64] will-change-scroll"
        outerRef={setMapRef}
        columnCount={gridSize}
        columnWidth={tileSize}
        rowCount={gridSize}
        rowHeight={tileSize}
        height={mapHeight}
        width={width}
        itemData={fixedGridData}
        initialScrollLeft={offsetX}
        initialScrollTop={offsetY}
        onScroll={onScroll}
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
