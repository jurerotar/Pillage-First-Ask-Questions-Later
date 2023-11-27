import React from 'react';
import { useMapOptions } from 'app/(game)/map/providers/map-context';
import clsx from 'clsx';
import { Icon } from 'components/icon';
import { Tooltip } from 'components/tooltip';

type MagnificationButtonProps = {
  direction: 'increase' | 'decrease';
}

const MagnificationButton: React.FC<MagnificationButtonProps> = ({ direction }) => {
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
    >
      {direction === 'increase' && (
        <Icon type="mapMagnificationIncrease" />
      )}
      {direction === 'decrease' && (
        <Icon type="mapMagnificationDecrease" />
      )}
    </button>
  )
};

export const MapControls: React.FC = () => {
  const { mapFilters, toggleMapFilter } = useMapOptions();
  const {
    shouldShowFactionReputation,
    shouldShowOasisIcons,
    shouldShowTroopMovements,
    shouldShowWheatFields,
    shouldShowTileTooltips,
    shouldShowTreasureIcons
  } = mapFilters;

  return (
    <>
      <Tooltip id="map-controls-tooltip" />
      <div className="flex flex-col gap-2 fixed bottom-8 right-8 items-end pointer-events-none">
        <div className="flex flex-col p-2 gap-2 rounded-md bg-white w-fit pointer-events-auto">
         <MagnificationButton direction="increase" />
          <span className="w-full h-1 bg-gray-300 rounded-md" />
          <MagnificationButton direction="decrease" />
        </div>
        <div className="flex gap-2 p-2 rounded-md bg-white pointer-events-auto">
          <a
            data-tooltip-id="map-controls-tooltip"
            data-tooltip-content="Hello to you too!"
          >
            <button
              data-testid="map-controls-toggle-faction-reputation-button"
              className={clsx(shouldShowFactionReputation && 'bg-green-200', 'rounded-md p-1')}
              onClick={() => toggleMapFilter('shouldShowFactionReputation')}
              type="button"
            >
              <Icon type="mapReputationToggle" />
            </button>
          </a>
          <span className="flex w-1 bg-gray-300 rounded-md" />
          <a
            data-tooltip-id="map-controls-tooltip"
            data-tooltip-content="Hello to you too!"
          >
            <button
              data-testid="map-controls-toggle-oasis-button"
              className={clsx(shouldShowOasisIcons && 'bg-green-200', 'rounded-md p-1')}
              onClick={() => toggleMapFilter('shouldShowOasisIcons')}
              type="button"
            >
              <Icon type="mapOasisIconsToggle" />
            </button>
          </a>
          <span className="flex w-1 bg-gray-300 rounded-md" />
          <a
            data-tooltip-id="map-controls-tooltip"
            data-tooltip-content="Hello to you too!"
          >
            <button
              data-testid="map-controls-toggle-treasures-button"
              className={clsx(shouldShowTreasureIcons && 'bg-green-200', 'rounded-md p-1')}
              onClick={() => toggleMapFilter('shouldShowTreasureIcons')}
              type="button"
            >
              <Icon type="mapTreasureIconToggle" />
            </button>
          </a>
          <span className="flex w-1 bg-gray-300 rounded-md" />
          <a
            data-tooltip-id="map-controls-tooltip"
            data-tooltip-content="Hello to you too!"
          >
            <button
              data-testid="map-controls-toggle-troop-movements-button"
              className={clsx(shouldShowTroopMovements && 'bg-green-200', 'rounded-md p-1')}
              onClick={() => toggleMapFilter('shouldShowTroopMovements')}
              type="button"
            >
              <Icon type="mapTroopMovementsToggle" />
            </button>
          </a>
          <span className="flex w-1 bg-gray-300 rounded-md" />
          <a
            data-tooltip-id="map-controls-tooltip"
            data-tooltip-content="Hello to you too!"
          >
            <button
              data-testid="map-controls-toggle-wheat-fields-button"
              className={clsx(shouldShowWheatFields && 'bg-green-200', 'rounded-md p-1')}
              onClick={() => toggleMapFilter('shouldShowWheatFields')}
              type="button"
            >
              <Icon type="mapWheatFieldIconToggle" />
            </button>
          </a>
          <span className="flex w-1 bg-gray-300 rounded-md" />
          <a
            data-tooltip-id="map-controls-tooltip"
            data-tooltip-content="Hello to you too!"
          >
            <button
              data-testid="map-controls-toggle-tile-tooltips-button"
              className={clsx(shouldShowTileTooltips && 'bg-green-200', 'rounded-md p-1')}
              onClick={() => toggleMapFilter('shouldShowTileTooltips')}
              type="button"
            >
              <Icon type="mapTileTooltipToggle" />
            </button>
          </a>
        </div>
      </div>
    </>
  );
};
