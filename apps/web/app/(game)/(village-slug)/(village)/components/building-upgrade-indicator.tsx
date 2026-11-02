import {
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
  use,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { MdUpgrade } from 'react-icons/md';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import type { BuildingEvent } from '@pillage-first/types/models/game-event';
import {
  BorderIndicator,
  type BorderIndicatorBackgroundVariant,
  type BorderIndicatorBorderVariant,
} from 'app/(game)/(village-slug)/components/border-indicator';
import { BuildingUpgradeStatusContext } from 'app/(game)/(village-slug)/providers/building-upgrade-status-provider';
import { CurrentVillageBuildingQueueContext } from 'app/(game)/(village-slug)/providers/current-village-building-queue-context';

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
    <div className="rounded-full non-selectable transition-transform relative pointer-events-none">
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
  nextLevel: number;
  backgroundVariant: BorderIndicatorBackgroundVariant;
  onUpgrade: () => void;
  variant: BorderIndicatorBorderVariant;
};

const UpgradeButton = ({
  buildingField,
  nextLevel,
  backgroundVariant,
  onUpgrade,
  variant,
}: UpgradeButtonProps) => {
  const { t } = useTranslation();
  const { level, buildingId } = buildingField;

  const [shouldShowUpgradeButton, setShouldShowUpgradeButton] =
    useState<boolean>(false);

  const onUpgradeButtonClick = (event: ReactMouseEvent | ReactTouchEvent) => {
    event.stopPropagation();
    event.preventDefault();
    onUpgrade();
  };

  return (
    <button
      className="hover:scale-125 rounded-full non-selectable cursor-pointer pointer-events-auto transition-transform relative focus:outline-hidden focus:ring-2 focus:ring-black/80 dark:focus:ring-ring"
      type="button"
      aria-label={t('Upgrade {{building}} to level {{level}}', {
        building: t(`BUILDINGS.${buildingId}.NAME`),
        level: nextLevel,
      })}
      onClick={onUpgradeButtonClick}
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
        {!shouldShowUpgradeButton && <span>{level}</span>}
      </BorderIndicator>
    </button>
  );
};

type BuildingUpgradeIndicatorProps = {
  isHovered: boolean;
  buildingField: BuildingField;
  nextLevel: number;
  buildingEvent: BuildingEvent | undefined;
  onUpgrade: () => void;
};

export const BuildingUpgradeIndicator = ({
  buildingField,
  nextLevel,
  isHovered,
  buildingEvent,
  onUpgrade,
}: BuildingUpgradeIndicatorProps) => {
  const { variant, canUpgrade } = use(BuildingUpgradeStatusContext);
  const { buildingUpgradeEventCountByFieldId } = use(
    CurrentVillageBuildingQueueContext,
  );
  const hasActiveOrScheduledUpgrade = buildingUpgradeEventCountByFieldId.has(
    buildingField.id,
  );

  const backgroundVariant = ((): BorderIndicatorBackgroundVariant => {
    if (buildingEvent || hasActiveOrScheduledUpgrade) {
      return 'orange';
    }

    return 'white';
  })();

  const ChildComponent = canUpgrade && isHovered ? UpgradeButton : StaticButton;

  // TODO: Transitions needs to added here, the icon currently just pops in
  return (
    <ChildComponent
      buildingField={buildingField}
      nextLevel={nextLevel}
      backgroundVariant={backgroundVariant}
      onUpgrade={onUpgrade}
      variant={variant}
    />
  );
};
