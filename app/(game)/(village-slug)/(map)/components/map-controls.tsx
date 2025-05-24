import { useMapFilters } from 'app/(game)/(village-slug)/(map)/hooks/use-map-filters';
import { MapContext, MAX_MAGNIFICATION, MIN_MAGNIFICATION } from 'app/(game)/(village-slug)/(map)/providers/map-context';
import { Icon } from 'app/components/icon';
import { Tooltip } from 'app/components/tooltip';
import clsx from 'clsx';
import type React from 'react';
import { use } from 'react';
import { useTranslation } from 'react-i18next';
import { Divider } from 'app/components/divider';

type MagnificationButtonProps = {
  direction: 'increase' | 'decrease';
};

const MagnificationButton: React.FC<MagnificationButtonProps> = ({ direction }) => {
  const { t } = useTranslation();
  const { magnification, increaseMagnification, decreaseMagnification } = use(MapContext);

  const onClick = direction === 'increase' ? increaseMagnification : decreaseMagnification;
  const isDisabled = direction === 'increase' ? magnification === MAX_MAGNIFICATION : magnification === MIN_MAGNIFICATION;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={clsx('rounded-md p-1', isDisabled && 'bg-gray-200')}
      data-testid={direction === 'increase' ? 'map-controls-magnification-increase-button' : 'map-controls-magnification-decrease-button'}
      aria-label={direction === 'increase' ? t('Zoom in') : t('Zoom out')}
    >
      {direction === 'increase' && <Icon type="mapMagnificationIncrease" />}
      {direction === 'decrease' && <Icon type="mapMagnificationDecrease" />}
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

  return (
    <>
      <Tooltip id="map-controls-tooltip" />
      <div className="pointer-events-none fixed top-29 standalone:top-41 lg:top-23 right-2 md:right-4 flex flex-col items-end gap-1 sm:gap-2">
        <div className="pointer-events-auto flex gap-1 sm:gap-2 rounded-md bg-white p-1 md:p-2">
          <span
            data-tooltip-id="map-controls-tooltip"
            data-tooltip-content={t('Toggle faction reputation display')}
          >
            <button
              data-testid="map-controls-toggle-faction-reputation-button"
              className={clsx(shouldShowFactionReputation && 'bg-green-200', 'rounded-md p-1')}
              onClick={() => toggleMapFilter({ shouldShowFactionReputation: !shouldShowFactionReputation })}
              type="button"
              aria-label={t('Toggle faction reputation display')}
            >
              <Icon type="mapReputationToggle" />
            </button>
          </span>
          <Divider />
          <span
            data-tooltip-id="map-controls-tooltip"
            data-tooltip-content={t('Toggle oasis resource icons display')}
          >
            <button
              data-testid="map-controls-toggle-oasis-button"
              className={clsx(shouldShowOasisIcons && 'bg-green-200', 'rounded-md p-1')}
              onClick={() => toggleMapFilter({ shouldShowOasisIcons: !shouldShowOasisIcons })}
              type="button"
              aria-label={t('Toggle oasis resource icons display')}
            >
              <Icon type="mapOasisIconsToggle" />
            </button>
          </span>
          <Divider />
          <span
            data-tooltip-id="map-controls-tooltip"
            data-tooltip-content={t('Toggle treasure villages icons display')}
          >
            <button
              data-testid="map-controls-toggle-treasures-button"
              className={clsx(shouldShowTreasureIcons && 'bg-green-200', 'rounded-md p-1')}
              onClick={() => toggleMapFilter({ shouldShowTreasureIcons: !shouldShowTreasureIcons })}
              type="button"
              aria-label={t('Toggle treasure villages icons display')}
            >
              <Icon type="mapTreasureIconToggle" />
            </button>
          </span>
          <Divider />
          <span
            data-tooltip-id="map-controls-tooltip"
            data-tooltip-content={t('Toggle troop movements display')}
          >
            <button
              data-testid="map-controls-toggle-troop-movements-button"
              className={clsx(shouldShowTroopMovements && 'bg-green-200', 'rounded-md p-1')}
              onClick={() => toggleMapFilter({ shouldShowTroopMovements: !shouldShowTroopMovements })}
              type="button"
              aria-label={t('Toggle troop movements display')}
            >
              <Icon type="mapTroopMovementsToggle" />
            </button>
          </span>
          <Divider />
          <span
            data-tooltip-id="map-controls-tooltip"
            data-tooltip-content={t('Toggle wheat field icons display')}
          >
            <button
              data-testid="map-controls-toggle-wheat-fields-button"
              className={clsx(shouldShowWheatFields && 'bg-green-200', 'rounded-md p-1')}
              onClick={() => toggleMapFilter({ shouldShowWheatFields: !shouldShowWheatFields })}
              type="button"
              aria-label={t('Toggle wheat field icons display')}
            >
              <Icon type="mapWheatFieldIconToggle" />
            </button>
          </span>
          <Divider className="hidden lg:inline-flex" />
          <span
            data-tooltip-id="map-controls-tooltip"
            data-tooltip-content={t('Toggle tooltip popups')}
            className="hidden lg:inline-flex"
          >
            <button
              data-testid="map-controls-toggle-tile-tooltips-button"
              className={clsx(shouldShowTileTooltips && 'bg-green-200', 'rounded-md p-1')}
              onClick={() => toggleMapFilter({ shouldShowTileTooltips: !shouldShowTileTooltips })}
              type="button"
              aria-label={t('Toggle tooltip popups')}
            >
              <Icon type="mapTileTooltipToggle" />
            </button>
          </span>
        </div>
        <div className="pointer-events-auto flex w-fit flex-col gap-1 sm:gap-2 rounded-md bg-white p-1 md:p-2">
          <MagnificationButton direction="increase" />
          <Divider orientation="horizontal" />
          <MagnificationButton direction="decrease" />
        </div>
      </div>
    </>
  );
};
