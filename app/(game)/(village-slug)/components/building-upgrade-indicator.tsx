import { useBuildingActions } from 'app/(game)/(village-slug)/(village)/hooks/use-building-actions';
import {
  BorderIndicator,
  type BorderIndicatorBackgroundVariant,
  type BorderIndicatorBorderVariant,
} from 'app/(game)/(village-slug)/components/border-indicator';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import useLongPress from 'app/hooks/events/use-long-press';
import type { BuildingField } from 'app/interfaces/models/game/village';
import clsx from 'clsx';
import type React from 'react';
import { use, useState } from 'react';
import { ViewportContext } from 'app/providers/viewport-context';
import { MdUpgrade } from 'react-icons/md';
import type { Building } from 'app/interfaces/models/game/building';
import { useBuildingUpgradeStatus } from 'app/(game)/(village-slug)/hooks/use-building-level-change-status';
import { useCurrentVillageBuildingEvents } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village-building-events';

type StaticButtonProps = {
  level: number;
  backgroundVariant: BorderIndicatorBackgroundVariant;
  variant: BorderIndicatorBorderVariant;
  canUpgrade: boolean;
};

const StaticButton: React.FC<StaticButtonProps> = ({ level, backgroundVariant, variant, canUpgrade }) => (
  <button
    className={clsx(canUpgrade && 'lg:hover:scale-125', 'rounded-full cursor-pointer transition-transform duration-300 relative')}
    type="button"
    disabled={!canUpgrade}
  >
    <BorderIndicator
      backgroundVariant={backgroundVariant}
      variant={variant}
    >
      {level}
    </BorderIndicator>
  </button>
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
  const { isWiderThanMd } = use(ViewportContext);

  const [shouldShowUpgradeButton, setShouldShowUpgradeButton] = useState<boolean>(false);

  const onUpgradeButtonClick = (event: React.MouseEvent | React.TouchEvent) => {
    upgradeBuilding();
    event.stopPropagation();
    event.preventDefault();
  };

  const longPressEvent = useLongPress((event) => {
    onUpgradeButtonClick(event);
  });

  return (
    <button
      className="hover:scale-125 rounded-full cursor-pointer transition-transform duration-300 relative"
      type="button"
      onClick={onUpgradeButtonClick}
      {...(!isWiderThanMd && longPressEvent)}
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
};

export const BuildingUpgradeIndicator: React.FC<BuildingUpgradeIndicatorProps> = ({ buildingFieldId, isHovered }) => {
  const { currentVillage } = useCurrentVillage();
  const { currentVillageBuildingEvents } = useCurrentVillageBuildingEvents();
  const { getBuildingUpgradeIndicatorVariant, getBuildingUpgradeErrorBag } = useBuildingUpgradeStatus(buildingFieldId);

  const variant = getBuildingUpgradeIndicatorVariant();
  const buildingUpgradeErrorBag = getBuildingUpgradeErrorBag();
  const { buildingId, level } = currentVillage.buildingFields.find(({ id }) => buildingFieldId === id)!;

  const canUpgrade: boolean = buildingUpgradeErrorBag.length === 0;

  const backgroundVariant = ((): BorderIndicatorBackgroundVariant => {
    const hasSameBuildingConstructionEvents = currentVillageBuildingEvents.some(({ buildingFieldId: eventBuildingFieldId, building }) => {
      return building.id === buildingId && eventBuildingFieldId === buildingFieldId;
    });

    if (hasSameBuildingConstructionEvents) {
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
      canUpgrade={canUpgrade}
    />
  );
};
