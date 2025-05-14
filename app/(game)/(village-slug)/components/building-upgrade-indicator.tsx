import { useBuildingActions } from 'app/(game)/(village-slug)/(village)/hooks/use-building-actions';
import {
  BorderIndicator,
  type BorderIndicatorBackgroundVariant,
  type BorderIndicatorBorderVariant,
} from 'app/(game)/(village-slug)/components/border-indicator';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import type { BuildingField } from 'app/interfaces/models/game/village';
import type React from 'react';
import { useState } from 'react';
import { MdUpgrade } from 'react-icons/md';
import type { Building } from 'app/interfaces/models/game/building';
import { useBuildingUpgradeStatus } from 'app/(game)/(village-slug)/hooks/use-building-level-change-status';
import type { GameEvent } from 'app/interfaces/models/game/game-event';

type StaticButtonProps = {
  level: number;
  backgroundVariant: BorderIndicatorBackgroundVariant;
  variant: BorderIndicatorBorderVariant;
};

const StaticButton: React.FC<StaticButtonProps> = ({ level, backgroundVariant, variant }) => (
  <div className="rounded-full cursor-pointer transition-transform duration-300 relative pointer-events-none lg:pointer-events-auto">
    <BorderIndicator
      backgroundVariant={backgroundVariant}
      variant={variant}
    >
      {level}
    </BorderIndicator>
  </div>
);

type UpgradeButtonProps = {
  buildingId: Building['id'];
  buildingFieldId: BuildingField['id'];
  backgroundVariant: BorderIndicatorBackgroundVariant;
  variant: BorderIndicatorBorderVariant;
  level: number;
};

const UpgradeButton: React.FC<UpgradeButtonProps> = ({ buildingId, buildingFieldId, backgroundVariant, variant, level }) => {
  const { upgradeBuilding } = useBuildingActions(buildingId, buildingFieldId);

  const [shouldShowUpgradeButton, setShouldShowUpgradeButton] = useState<boolean>(false);

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
        {shouldShowUpgradeButton && <MdUpgrade className="size-3/4 rounded-full text-gray-400" />}
        {!shouldShowUpgradeButton && level}
      </BorderIndicator>
    </button>
  );
};

type BuildingUpgradeIndicatorProps = {
  isHovered: boolean;
  buildingFieldId: BuildingField['id'];
  buildingEvent: GameEvent<'buildingLevelChange'> | undefined;
};

export const BuildingUpgradeIndicator: React.FC<BuildingUpgradeIndicatorProps> = ({ buildingFieldId, isHovered, buildingEvent }) => {
  const { currentVillage } = useCurrentVillage();
  const { variant, errors } = useBuildingUpgradeStatus(buildingFieldId);

  const { buildingId, level } = currentVillage.buildingFields.find(({ id }) => buildingFieldId === id)!;

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
        buildingId={buildingId}
        buildingFieldId={buildingFieldId}
        backgroundVariant={backgroundVariant}
        variant={variant}
        level={level}
      />
    );
  }

  return (
    <StaticButton
      level={level}
      backgroundVariant={backgroundVariant}
      variant={variant}
    />
  );
};
