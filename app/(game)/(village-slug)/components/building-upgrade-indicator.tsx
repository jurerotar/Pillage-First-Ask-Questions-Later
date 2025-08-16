import { useBuildingActions } from 'app/(game)/(village-slug)/(village)/hooks/use-building-actions';
import {
  BorderIndicator,
  type BorderIndicatorBackgroundVariant,
  type BorderIndicatorBorderVariant,
} from 'app/(game)/(village-slug)/components/border-indicator';
import type { BuildingField } from 'app/interfaces/models/game/village';
import type React from 'react';
import { useState } from 'react';
import { useBuildingUpgradeStatus } from 'app/(game)/(village-slug)/hooks/use-building-level-change-status';
import type { GameEvent } from 'app/interfaces/models/game/game-event';

type StaticButtonProps = {
  buildingField: BuildingField;
  backgroundVariant: BorderIndicatorBackgroundVariant;
  variant: BorderIndicatorBorderVariant;
};

const StaticButton: React.FC<StaticButtonProps> = ({
  buildingField,
  backgroundVariant,
  variant,
}) => {
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

const UpgradeButton: React.FC<UpgradeButtonProps> = ({
  buildingField,
  backgroundVariant,
  variant,
}) => {
  const { buildingId, id, level } = buildingField;
  const { upgradeBuilding } = useBuildingActions(buildingId, id);

  const [shouldShowUpgradeButton, setShouldShowUpgradeButton] =
    useState<boolean>(false);

  const onUpgradeButtonClick = (event: React.MouseEvent | React.TouchEvent) => {
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
          <i className="icon icon-[md-upgrade] size-3/4 rounded-full text-gray-400" />
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

export const BuildingUpgradeIndicator: React.FC<
  BuildingUpgradeIndicatorProps
> = ({ buildingField, isHovered, buildingEvent }) => {
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
