import { useClickOutside } from '@mantine/hooks';
import { clsx } from 'clsx';
import { use, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OasisAnimalFinderLink } from 'app/(game)/(village-slug)/(map)/components/oasis-animal-finder-link';
import { OasisBonusFinderLink } from 'app/(game)/(village-slug)/(map)/components/oasis-bonus-finder-link';
import { useMapFilters } from 'app/(game)/(village-slug)/(map)/hooks/use-map-filters';
import { MapContext } from 'app/(game)/(village-slug)/(map)/providers/map-context';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';
import { GameLayoutContext } from 'app/(game)/(village-slug)/providers/game-layout-context';
import { Icon } from 'app/components/icon';
import { ToggleGroup, ToggleGroupItem } from 'app/components/ui/toggle-group';

const MagnificationButton = ({
  direction,
}: {
  direction: 'increase' | 'decrease';
}) => {
  const { t } = useTranslation();
  const {
    magnification,
    increaseMagnification,
    decreaseMagnification,
    MAX_MAGNIFICATION,
    MIN_MAGNIFICATION,
  } = use(MapContext);

  const onClick =
    direction === 'increase' ? increaseMagnification : decreaseMagnification;
  const isDisabled =
    direction === 'increase'
      ? magnification === MAX_MAGNIFICATION
      : magnification === MIN_MAGNIFICATION;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={clsx(
        'inline-flex size-8 items-center justify-center rounded-md p-2 disabled:text-muted-foreground/50 text-muted-foreground hover:bg-accent transition-colors border border-border',
        isDisabled && 'bg-muted',
      )}
      data-testid={`map-controls-magnification-${direction}-button`}
      aria-label={direction === 'increase' ? t('Zoom in') : t('Zoom out')}
      data-tooltip-id="general-tooltip"
      data-tooltip-content={
        direction === 'increase' ? t('Zoom in') : t('Zoom out')
      }
    >
      <Icon
        type={
          direction === 'increase'
            ? 'mapMagnificationIncrease'
            : 'mapMagnificationDecrease'
        }
        shouldShowTooltip={false}
      />
    </button>
  );
};

export const MapFilters = () => {
  const { t } = useTranslation();
  const canHover = useMediaQuery('(hover: hover) and (pointer: fine)');
  const { areMobileDetailsVisible } = use(GameLayoutContext);
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useClickOutside<HTMLFieldSetElement>(() => {
    setIsExpanded(false);
  });
  const {
    shouldShowFactionReputation,
    shouldShowOasisIcons,
    shouldShowTroopMovements,
    shouldShowWheatFields,
    shouldShowTileTooltips,
    shouldShowTreasureIcons,
    toggleMapFilter,
  } = useMapFilters();

  const activeValues = [
    shouldShowFactionReputation ? 'shouldShowFactionReputation' : null,
    shouldShowOasisIcons ? 'shouldShowOasisIcons' : null,
    shouldShowTreasureIcons ? 'shouldShowTreasureIcons' : null,
    shouldShowTroopMovements ? 'shouldShowTroopMovements' : null,
    shouldShowWheatFields ? 'shouldShowWheatFields' : null,
    shouldShowTileTooltips ? 'shouldShowTileTooltips' : null,
  ].flatMap((v) => (v ? [v] : []));

  return (
    <div
      className={clsx(
        areMobileDetailsVisible ? 'top-29' : 'top-25',
        'pointer-events-none fixed lg:top-23 right-2 md:right-4 flex flex-col items-end gap-2 transition-[top] ease-out',
      )}
    >
      <div className="flex items-start justify-end gap-2">
        <div className="flex flex-col items-end gap-2">
          <fieldset
            ref={containerRef}
            className="pointer-events-auto m-0 flex w-fit items-center justify-end border-0 p-0"
            aria-label={t('Map filters')}
            onPointerEnter={() => {
              if (canHover) {
                setIsExpanded(true);
              }
            }}
            onPointerLeave={() => {
              if (canHover) {
                setIsExpanded(false);
              }
            }}
            onFocus={() => setIsExpanded(true)}
            onBlur={(event) => {
              const nextFocusedElement = event.relatedTarget;

              if (
                !(nextFocusedElement instanceof Node) ||
                !event.currentTarget.contains(nextFocusedElement)
              ) {
                setIsExpanded(false);
              }
            }}
          >
            <div
              id="map-filters-panel"
              aria-hidden={!isExpanded}
              inert={!isExpanded ? true : undefined}
              className={clsx(
                'overflow-hidden transition-[max-width,opacity,transform] duration-200 ease-out',
                isExpanded
                  ? 'max-w-72 translate-x-0 opacity-100'
                  : 'pointer-events-none max-w-0 translate-x-1 opacity-0',
              )}
            >
              <ToggleGroup
                type="multiple"
                variant="outline"
                size="sm"
                value={activeValues}
                className="flex-nowrap gap-1 rounded-r-none rounded-l-md bg-background p-1 md:gap-2 md:p-2"
              >
                <ToggleGroupItem
                  value="shouldShowFactionReputation"
                  onClick={() =>
                    toggleMapFilter({
                      filterName: 'shouldShowFactionReputation',
                      value: !shouldShowFactionReputation,
                    })
                  }
                  aria-label={t('Toggle faction reputation display')}
                  data-tooltip-id="general-tooltip"
                  data-tooltip-content={t('Toggle faction reputation display')}
                  data-testid="map-filters-toggle-faction-reputation-button"
                >
                  <Icon
                    className="grayscale"
                    type="mapReputationToggle"
                    shouldShowTooltip={false}
                  />
                </ToggleGroupItem>

                <ToggleGroupItem
                  value="shouldShowOasisIcons"
                  onClick={() =>
                    toggleMapFilter({
                      filterName: 'shouldShowOasisIcons',
                      value: !shouldShowOasisIcons,
                    })
                  }
                  aria-label={t('Toggle oasis resource icons display')}
                  data-tooltip-id="general-tooltip"
                  data-tooltip-content={t(
                    'Toggle oasis resource icons display',
                  )}
                  data-testid="map-filters-toggle-oasis-button"
                >
                  <Icon
                    className="grayscale"
                    type="mapOasisIconsToggle"
                    shouldShowTooltip={false}
                  />
                </ToggleGroupItem>

                <ToggleGroupItem
                  value="shouldShowTreasureIcons"
                  onClick={() =>
                    toggleMapFilter({
                      filterName: 'shouldShowTreasureIcons',
                      value: !shouldShowTreasureIcons,
                    })
                  }
                  aria-label={t('Toggle treasure villages icons display')}
                  data-tooltip-id="general-tooltip"
                  data-tooltip-content={t(
                    'Toggle treasure villages icons display',
                  )}
                  data-testid="map-filters-toggle-treasures-button"
                >
                  <Icon
                    className="grayscale"
                    type="mapTreasureIconToggle"
                    shouldShowTooltip={false}
                  />
                </ToggleGroupItem>

                <ToggleGroupItem
                  value="shouldShowTroopMovements"
                  onClick={() =>
                    toggleMapFilter({
                      filterName: 'shouldShowTroopMovements',
                      value: !shouldShowTroopMovements,
                    })
                  }
                  aria-label={t('Toggle troop movements display')}
                  data-tooltip-id="general-tooltip"
                  data-tooltip-content={t('Toggle troop movements display')}
                  data-testid="map-filters-toggle-troop-movements-button"
                >
                  <Icon
                    className="grayscale"
                    type="mapTroopMovementsToggle"
                    shouldShowTooltip={false}
                  />
                </ToggleGroupItem>

                <ToggleGroupItem
                  value="shouldShowWheatFields"
                  onClick={() =>
                    toggleMapFilter({
                      filterName: 'shouldShowWheatFields',
                      value: !shouldShowWheatFields,
                    })
                  }
                  aria-label={t('Toggle wheat field icons display')}
                  data-tooltip-id="general-tooltip"
                  data-tooltip-content={t('Toggle wheat field icons display')}
                  data-testid="map-filters-toggle-wheat-fields-button"
                >
                  <Icon
                    className="grayscale"
                    type="mapWheatFieldIconToggle"
                    shouldShowTooltip={false}
                  />
                </ToggleGroupItem>

                <div className="hidden lg:flex">
                  <ToggleGroupItem
                    value="shouldShowTileTooltips"
                    onClick={() =>
                      toggleMapFilter({
                        filterName: 'shouldShowTileTooltips',
                        value: !shouldShowTileTooltips,
                      })
                    }
                    aria-label={t('Toggle tooltip popups')}
                    data-tooltip-id="general-tooltip"
                    data-tooltip-content={t('Toggle tooltip popups')}
                    data-testid="map-filters-toggle-tile-tooltips-button"
                  >
                    <Icon
                      className="grayscale"
                      type="mapTileTooltipToggle"
                      shouldShowTooltip={false}
                    />
                  </ToggleGroupItem>
                </div>
              </ToggleGroup>
            </div>

            <div
              className={clsx(
                'rounded-md bg-background p-1 md:p-2',
                isExpanded && 'rounded-l-none',
              )}
            >
              <button
                type="button"
                aria-controls="map-filters-panel"
                aria-expanded={isExpanded}
                aria-label={t('Map filters')}
                className={clsx(
                  'inline-flex size-8 items-center justify-center rounded-md border border-border bg-background p-2 text-muted-foreground transition-colors hover:bg-accent',
                  isExpanded && 'bg-accent text-accent-foreground',
                )}
                data-tooltip-id="general-tooltip"
                data-tooltip-content={t('Map filters')}
                data-testid="map-filters-toggle-button"
                onClick={() => {
                  if (!canHover) {
                    setIsExpanded((currentValue) => !currentValue);
                  }
                }}
              >
                <Icon
                  type="mapFiltersToggle"
                  shouldShowTooltip={false}
                />
              </button>
            </div>
          </fieldset>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="pointer-events-auto flex w-fit flex-col gap-1 rounded-md bg-background p-1 md:p-2">
            <MagnificationButton direction="increase" />
            <MagnificationButton direction="decrease" />
          </div>

          <div className="pointer-events-auto flex w-fit flex-col gap-1 sm:gap-2">
            <OasisBonusFinderLink />
            <OasisAnimalFinderLink />
          </div>
        </div>
      </div>
    </div>
  );
};
