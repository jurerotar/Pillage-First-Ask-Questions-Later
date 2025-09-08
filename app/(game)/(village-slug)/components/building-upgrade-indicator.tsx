import { useBuildingActions } from 'app/(game)/(village-slug)/(village)/hooks/use-building-actions';
import {
  BorderIndicator,
  type BorderIndicatorBackgroundVariant,
  type BorderIndicatorBorderVariant,
} from 'app/(game)/(village-slug)/components/border-indicator';
import type { BuildingField } from 'app/interfaces/models/game/village';
import {
  useState,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from 'react';
import { useBuildingUpgradeStatus } from 'app/(game)/(village-slug)/hooks/use-building-level-change-status';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { MdUpgrade } from 'react-icons/md';

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
    <div className="rounded-full cursor-pointer transition-transform duration-300 relative pointer-events-none lg:pointer-events-auto">
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
    upgradeBuilding();
    event.stopPropagation();
    event.preventDefault();
  };

  return (
    <button
      className="hover:scale-125 rounded-full cursor-pointer transition-transform duration-300 relative"
      type="button"
      onClick={onUpgradeButtonClick}
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
  buildingEvent: GameEvent<'buildingConstruction'> | undefined;
};

export const BuildingUpgradeIndicator = ({
  buildingField,
  isHovered,
  buildingEvent,
}: BuildingUpgradeIndicatorProps) => {
  const { variant, errors } = useBuildingUpgradeStatus(buildingField);

  const canUpgrade: boolean = errors.length === 0;

  const backgroundVariant = ((): BorderIndicatorBackgroundVariant => {
    if (buildingEvent) {
      return 'orange';
    }

    return 'white';
  })();

  // TODO: Transitions needs to added here, the icon currently just pops in

  if (canUpgrade && isHovered) {
    return (
      <UpgradeButton
        buildingField={buildingField}
        backgroundVariant={backgroundVariant}
        variant={variant}
      />
    );
  }

  return (
    <StaticButton
      buildingField={buildingField}
      backgroundVariant={backgroundVariant}
      variant={variant}
    />
  );
};
