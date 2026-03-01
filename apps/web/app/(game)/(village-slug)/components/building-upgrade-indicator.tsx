import {
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
  use,
  useState,
} from 'react';
import { MdUpgrade } from 'react-icons/md';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import type { BuildingEvent } from '@pillage-first/types/models/game-event';
import { useBuildingActions } from 'app/(game)/(village-slug)/(village)/hooks/use-building-actions';
import {
  BorderIndicator,
  type BorderIndicatorBackgroundVariant,
  type BorderIndicatorBorderVariant,
} from 'app/(game)/(village-slug)/components/border-indicator';
import { BuildingUpgradeStatusContext } from 'app/(game)/(village-slug)/providers/building-upgrade-status-provider';

type StaticButtonProps = {
  buildingField: BuildingField;
  backgroundVariant: BorderIndicatorBackgroundVariant;
  variant: BorderIndicatorBorderVariant;
};

const StaticButton = ({
  buildingField,
  backgroundVariant,
  variant,
}: StaticButtonProps) => {
  const { level } = buildingField;
  return (
    <div className="rounded-full select-none transition-transform duration-300 relative pointer-events-none lg:pointer-events-auto">
      <BorderIndicator
        backgroundVariant={backgroundVariant}
        variant={variant}
      >
        {level}
      </BorderIndicator>
    </div>
  );
};

type UpgradeButtonProps = {
  buildingField: BuildingField;
  backgroundVariant: BorderIndicatorBackgroundVariant;
  variant: BorderIndicatorBorderVariant;
};

const UpgradeButton = ({
  buildingField,
  backgroundVariant,
  variant,
}: UpgradeButtonProps) => {
  const { buildingId, id, level } = buildingField;
  const { upgradeBuilding } = useBuildingActions(buildingId, id);

  const [shouldShowUpgradeButton, setShouldShowUpgradeButton] =
    useState<boolean>(false);

  const onUpgradeButtonClick = (event: ReactMouseEvent | ReactTouchEvent) => {
    event.stopPropagation();
    event.preventDefault();
    upgradeBuilding();
  };

  const onKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === 'Enter') {
      event.stopPropagation();
      event.preventDefault();
      upgradeBuilding();
    }
  };

  return (
    <button
      className="hover:scale-125 rounded-full select-none cursor-pointer transition-transform duration-300 relative focus:outline-hidden focus:ring-2 focus:ring-black/80"
      type="button"
      tabIndex={0}
      onClick={onUpgradeButtonClick}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setShouldShowUpgradeButton(true)}
      onMouseLeave={() => setShouldShowUpgradeButton(false)}
    >
      <BorderIndicator
        backgroundVariant={backgroundVariant}
        variant={variant}
      >
        {shouldShowUpgradeButton && (
          <MdUpgrade className="size-3/4 rounded-full text-gray-400" />
        )}
        {!shouldShowUpgradeButton && level}
      </BorderIndicator>
    </button>
  );
};

type BuildingUpgradeIndicatorProps = {
  isHovered: boolean;
  buildingField: BuildingField;
  buildingEvent: BuildingEvent | undefined;
};

export const BuildingUpgradeIndicator = ({
  buildingField,
  isHovered,
  buildingEvent,
}: BuildingUpgradeIndicatorProps) => {
  const { variant, errors } = use(BuildingUpgradeStatusContext);

  const canUpgrade: boolean = errors.length === 0;

  const backgroundVariant = ((): BorderIndicatorBackgroundVariant => {
    if (buildingEvent) {
      return 'orange';
    }

    return 'white';
  })();

  const ChildComponent = canUpgrade && isHovered ? UpgradeButton : StaticButton;

  // TODO: Transitions needs to added here, the icon currently just pops in
  return (
    <ChildComponent
      buildingField={buildingField}
      backgroundVariant={backgroundVariant}
      variant={variant}
    />
  );
};
