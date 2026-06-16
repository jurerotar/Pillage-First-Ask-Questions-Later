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
    <div className="rounded-full non-selectable transition-transform duration-300 relative pointer-events-none lg:pointer-events-auto">
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
  onUpgrade: () => void;
  variant: BorderIndicatorBorderVariant;
};

const UpgradeButton = ({
  buildingField,
  backgroundVariant,
  onUpgrade,
  variant,
}: UpgradeButtonProps) => {
  const { level } = buildingField;

  const [shouldShowUpgradeButton, setShouldShowUpgradeButton] =
    useState<boolean>(false);

  const onUpgradeButtonClick = (event: ReactMouseEvent | ReactTouchEvent) => {
    event.stopPropagation();
    event.preventDefault();
    onUpgrade();
  };

  const onKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === 'Enter') {
      event.stopPropagation();
      event.preventDefault();
      onUpgrade();
    }
  };

  return (
    <button
      className="hover:scale-125 rounded-full non-selectable cursor-pointer transition-transform duration-300 relative focus:outline-hidden focus:ring-2 focus:ring-black/80 dark:focus:ring-ring"
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
          <MdUpgrade className="size-3/4 rounded-full text-muted-foreground" />
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
  onUpgrade: () => void;
};

export const BuildingUpgradeIndicator = ({
  buildingField,
  isHovered,
  buildingEvent,
  onUpgrade,
}: BuildingUpgradeIndicatorProps) => {
  const { variant, canUpgrade } = use(BuildingUpgradeStatusContext);

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
      onUpgrade={onUpgrade}
      variant={variant}
    />
  );
};
