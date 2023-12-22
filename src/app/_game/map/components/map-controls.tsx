import React from 'react';
import clsx from 'clsx';
import { Icon } from 'components/icon';
import { Tooltip } from 'components/tooltip';
import { useTranslation } from 'react-i18next';
import { useMapFilters } from 'hooks/game/preferences/use-map-filters';
import { useMapOptions } from '../providers/map-context';

type DividerProps = {
  orientation?: 'vertical' | 'horizontal';
};

const Divider: React.FC<DividerProps> = ({ orientation = 'vertical' }) => {
  return (
    <span className={clsx(orientation === 'vertical' ? 'flex w-1' : 'h-1 w-full', 'rounded-md bg-gray-300')} />
  );
};

type MagnificationButtonProps = {
  direction: 'increase' | 'decrease';
};

const MagnificationButton: React.FC<MagnificationButtonProps> = ({ direction }) => {
  const { t } = useTranslation();
  const { magnification, increaseMagnification, decreaseMagnification } = useMapOptions();

  const onClick = direction === 'increase' ? increaseMagnification : decreaseMagnification;
  const isDisabled = direction === 'increase' ? magnification === 3 : magnification === 1;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={clsx('rounded-md p-1', isDisabled && 'bg-gray-200')}
      data-testid={direction === 'increase' ? 'map-controls-magnification-increase-button' : 'map-controls-magnification-decrease-button'}
      aria-label={t(direction === 'increase' ? 'APP.GAME.MAP.MAP_CONTROLS.MAGNIFICATION_INCREASE' : 'APP.GAME.MAP.MAP_CONTROLS.MAGNIFICATION_DECREASE')}
    >
      {direction === 'increase' && (
        <Icon type="mapMagnificationIncrease" />
      )}
      {direction === 'decrease' && (
        <Icon type="mapMagnificationDecrease" />
      )}
    </button>
  );
};

export const MapControls: React.FC = () => {
  const { t } = useTranslation();
  const { mapFilters, toggleMapFilter } = useMapFilters();
  const {
    shouldShowFactionReputation,
    shouldShowOasisIcons,
    shouldShowTroopMovements,
    shouldShowWheatFields,
    shouldShowTileTooltips,
    shouldShowTreasureIcons,
  } = mapFilters;

  return (
    <>
      <Tooltip id="map-controls-tooltip" />
      <div className="pointer-events-none fixed bottom-8 right-8 flex flex-col items-end gap-2">
        <div className="pointer-events-auto flex w-fit flex-col gap-2 rounded-md bg-white p-2">
          <MagnificationButton direction="increase" />
          <Divider orientation="horizontal" />
          <MagnificationButton direction="decrease" />
        </div>
        <div className="pointer-events-auto flex gap-2 rounded-md bg-white p-2">
          <span
            data-tooltip-id="map-controls-tooltip"
            data-tooltip-content={t('APP.GAME.MAP.MAP_CONTROLS.TOGGLE_REPUTATION_DISPLAY')}
          >
            <button
              data-testid="map-controls-toggle-faction-reputation-button"
              className={clsx(shouldShowFactionReputation && 'bg-green-200', 'rounded-md p-1')}
              onClick={() => toggleMapFilter('shouldShowFactionReputation')}
              type="button"
              aria-label={t('APP.GAME.MAP.MAP_CONTROLS.TOGGLE_REPUTATION_DISPLAY')}
            >
              <Icon type="mapReputationToggle" />
            </button>
          </span>
          <Divider />
          <span
            data-tooltip-id="map-controls-tooltip"
            data-tooltip-content={t('APP.GAME.MAP.MAP_CONTROLS.TOGGLE_OASIS_ICON_DISPLAY')}
          >
            <button
              data-testid="map-controls-toggle-oasis-button"
              className={clsx(shouldShowOasisIcons && 'bg-green-200', 'rounded-md p-1')}
              onClick={() => toggleMapFilter('shouldShowOasisIcons')}
              type="button"
              aria-label={t('APP.GAME.MAP.MAP_CONTROLS.TOGGLE_OASIS_ICON_DISPLAY')}
            >
              <Icon type="mapOasisIconsToggle" />
            </button>
          </span>
          <Divider />
          <span
            data-tooltip-id="map-controls-tooltip"
            data-tooltip-content={t('APP.GAME.MAP.MAP_CONTROLS.TOGGLE_TREASURES_DISPLAY')}
          >
            <button
              data-testid="map-controls-toggle-treasures-button"
              className={clsx(shouldShowTreasureIcons && 'bg-green-200', 'rounded-md p-1')}
              onClick={() => toggleMapFilter('shouldShowTreasureIcons')}
              type="button"
              aria-label={t('APP.GAME.MAP.MAP_CONTROLS.TOGGLE_TREASURES_DISPLAY')}
            >
              <Icon type="mapTreasureIconToggle" />
            </button>
          </span>
          <Divider />
          <span
            data-tooltip-id="map-controls-tooltip"
            data-tooltip-content={t('APP.GAME.MAP.MAP_CONTROLS.TOGGLE_TROOP_MOVEMENTS_DISPLAY')}
          >
            <button
              data-testid="map-controls-toggle-troop-movements-button"
              className={clsx(shouldShowTroopMovements && 'bg-green-200', 'rounded-md p-1')}
              onClick={() => toggleMapFilter('shouldShowTroopMovements')}
              type="button"
              aria-label={t('APP.GAME.MAP.MAP_CONTROLS.TOGGLE_TROOP_MOVEMENTS_DISPLAY')}
            >
              <Icon type="mapTroopMovementsToggle" />
            </button>
          </span>
          <Divider />
          <span
            data-tooltip-id="map-controls-tooltip"
            data-tooltip-content={t('APP.GAME.MAP.MAP_CONTROLS.TOGGLE_WHEAT_FIELDS_ICON_DISPLAY')}
          >
            <button
              data-testid="map-controls-toggle-wheat-fields-button"
              className={clsx(shouldShowWheatFields && 'bg-green-200', 'rounded-md p-1')}
              onClick={() => toggleMapFilter('shouldShowWheatFields')}
              type="button"
              aria-label={t('APP.GAME.MAP.MAP_CONTROLS.TOGGLE_WHEAT_FIELDS_ICON_DISPLAY')}
            >
              <Icon type="mapWheatFieldIconToggle" />
            </button>
          </span>
          <Divider />
          <span
            data-tooltip-id="map-controls-tooltip"
            data-tooltip-content={t('APP.GAME.MAP.MAP_CONTROLS.TOGGLE_TILE_TOOLTIP_DISPLAY')}
          >
            <button
              data-testid="map-controls-toggle-tile-tooltips-button"
              className={clsx(shouldShowTileTooltips && 'bg-green-200', 'rounded-md p-1')}
              onClick={() => toggleMapFilter('shouldShowTileTooltips')}
              type="button"
              aria-label={t('APP.GAME.MAP.MAP_CONTROLS.TOGGLE_TILE_TOOLTIP_DISPLAY')}
            >
              <Icon type="mapTileTooltipToggle" />
            </button>
          </span>
        </div>
      </div>
    </>
  );
};
