import { clsx } from 'clsx';
import { use } from 'react';
import { useTranslation } from 'react-i18next';
import { OasisBonusFinderLink } from 'app/(game)/(village-slug)/(map)/components/oasis-bonus-finder-link';
import { useMapFilters } from 'app/(game)/(village-slug)/(map)/hooks/use-map-filters';
import { MapContext } from 'app/(game)/(village-slug)/(map)/providers/map-context';
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
        'rounded-md p-2 disabled:text-black text-muted-foreground hover:bg-accent transition-colors duration-300 border border-border',
        isDisabled && 'bg-gray-200',
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

export const MapControls = () => {
  const { t } = useTranslation();
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
    <div className="pointer-events-none fixed top-31 standalone:top-31 lg:top-23 right-2 md:right-4 flex flex-col items-end gap-2 sm:gap-4">
      <ToggleGroup
        type="multiple"
        variant="outline"
        size="sm"
        value={activeValues}
        className="pointer-events-auto flex flex-wrap gap-1 sm:gap-2 rounded-md bg-background p-1 md:p-2"
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
          data-testid="map-controls-toggle-faction-reputation-button"
        >
          <Icon
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
          data-tooltip-content={t('Toggle oasis resource icons display')}
          data-testid="map-controls-toggle-oasis-button"
        >
          <Icon
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
          data-tooltip-content={t('Toggle treasure villages icons display')}
          data-testid="map-controls-toggle-treasures-button"
        >
          <Icon
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
          data-testid="map-controls-toggle-troop-movements-button"
        >
          <Icon
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
          data-testid="map-controls-toggle-wheat-fields-button"
        >
          <Icon
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
            data-testid="map-controls-toggle-tile-tooltips-button"
          >
            <Icon
              type="mapTileTooltipToggle"
              shouldShowTooltip={false}
            />
          </ToggleGroupItem>
        </div>
      </ToggleGroup>

      <div className="pointer-events-auto flex w-fit flex-col gap-1 sm:gap-2 rounded-md bg-background p-1 md:p-2">
        <MagnificationButton direction="increase" />
        <MagnificationButton direction="decrease" />
      </div>
      <div className="pointer-events-auto">
        <OasisBonusFinderLink />
      </div>
    </div>
  );
};
