import { clsx } from 'clsx';
import { type AnchorHTMLAttributes, use, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { getBuildingDefinition } from '@pillage-first/game-assets/utils/buildings';
import type { Building } from '@pillage-first/types/models/building';
import type { BuildingField as BuildingFieldType } from '@pillage-first/types/models/building-field';
import type { BuildingEvent } from '@pillage-first/types/models/game-event';
import type { ResourceFieldComposition } from '@pillage-first/types/models/resource-field-composition';
import buildingFieldStyles from 'app/(game)/(village-slug)/(village)/components/occupied-building-field.module.scss';
import { useBuildingActions } from 'app/(game)/(village-slug)/(village)/hooks/use-building-actions';
import { VillageMapContext } from 'app/(game)/(village-slug)/(village)/providers/village-map-context';
import { BuildingUpgradeIndicator } from 'app/(game)/(village-slug)/components/building-upgrade-indicator';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useBuildingConstructionStatus } from 'app/(game)/(village-slug)/hooks/use-building-construction-error-bag';
import { BuildingUpgradeStatusContext } from 'app/(game)/(village-slug)/providers/building-upgrade-status-provider';
import { CurrentVillageBuildingQueueContext } from 'app/(game)/(village-slug)/providers/current-village-building-queue-provider';
import { useLongPress } from 'app/hooks/use-long-press';

const transformBuildingIdIntoCssClass = (
  buildingId: Building['id'],
): string => {
  return buildingId.toLowerCase().replaceAll('_', '-');
};

type DynamicCellClassesArgs = {
  buildingField: BuildingFieldType;
  resourceFieldComposition: ResourceFieldComposition;
};

const dynamicCellClasses = ({
  buildingField,
  resourceFieldComposition,
}: DynamicCellClassesArgs): string => {
  const { buildingId, id } = buildingField;
  const isResourceField = id <= 18;

  if (isResourceField) {
    return clsx(
      buildingFieldStyles.building,
      `rfc-${resourceFieldComposition}`,
      buildingFieldStyles['building-resource'],
      buildingFieldStyles[`building-resource-${id}`],
    );
  }

  const buildingIdToCssClass = transformBuildingIdIntoCssClass(buildingId);

  return clsx(
    buildingFieldStyles.building,
    buildingFieldStyles[`building-village-${buildingIdToCssClass}`],
  );
};

type OccupiedBuildingFieldProps = {
  buildingField: BuildingFieldType;
};

export const OccupiedBuildingField = ({
  buildingField,
}: OccupiedBuildingFieldProps) => {
  const { t } = useTranslation();
  const { bookmarks } = use(VillageMapContext);
  const { buildingEventByFieldId } = use(CurrentVillageBuildingQueueContext);

  const { id: buildingFieldId, buildingId, level } = buildingField;

  const buildingDefinition = getBuildingDefinition(buildingId);
  const isMaxLevel = buildingDefinition.maxLevel === level;

  const tab = bookmarks[buildingId] ?? 'default';

  const currentBuildingFieldBuildingEvent =
    buildingEventByFieldId.get(buildingFieldId);

  const content = (
    <OccupiedBuildingFieldContent
      buildingField={buildingField}
      currentBuildingFieldBuildingEvent={currentBuildingFieldBuildingEvent}
      tab={tab}
    />
  );

  if (isMaxLevel) {
    const status = {
      canUpgrade: false,
      variant: 'blue' as const,
      errorBag: [t("Building can't be upgraded any further")],
    };

    return (
      <BuildingUpgradeStatusContext value={status}>
        {content}
      </BuildingUpgradeStatusContext>
    );
  }

  return (
    <OccupiedBuildingFieldActive
      buildingField={buildingField}
      currentBuildingFieldBuildingEvent={currentBuildingFieldBuildingEvent}
      tab={tab}
    />
  );
};

type OccupiedBuildingFieldActiveProps = {
  buildingField: BuildingFieldType;
  currentBuildingFieldBuildingEvent: BuildingEvent | undefined;
  tab: string;
};

const OccupiedBuildingFieldActive = ({
  buildingField,
  currentBuildingFieldBuildingEvent,
  tab,
}: OccupiedBuildingFieldActiveProps) => {
  const { isWiderThanLg } = use(VillageMapContext);
  const { id: buildingFieldId, buildingId, level } = buildingField;

  const { canUpgrade, variant } = useBuildingConstructionStatus(
    buildingId,
    level,
    buildingFieldId,
  );
  const status = useMemo(
    () => ({ canUpgrade, errorBag: [], variant }),
    [canUpgrade, variant],
  );
  const { upgradeBuilding } = useBuildingActions(buildingId, buildingFieldId);

  const onLongPress = () => {
    if (canUpgrade) {
      upgradeBuilding();
    }
  };

  const longPress = useLongPress(onLongPress, 1000);

  const [isHovered, setIsHovered] = useState<boolean>(false);

  return (
    <BuildingUpgradeStatusContext value={status}>
      <OccupiedBuildingFieldContent
        buildingField={buildingField}
        currentBuildingFieldBuildingEvent={currentBuildingFieldBuildingEvent}
        tab={tab}
        onUpgrade={upgradeBuilding}
        {...(isWiderThanLg
          ? {
              onMouseEnter: () => setIsHovered(true),
              onMouseLeave: () => setIsHovered(false),
              onFocus: () => setIsHovered(true),
              onBlur: (e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  setIsHovered(false);
                }
              },
            }
          : longPress)}
        isHovered={isHovered}
      />
    </BuildingUpgradeStatusContext>
  );
};

type OccupiedBuildingFieldContentProps = {
  buildingField: BuildingFieldType;
  currentBuildingFieldBuildingEvent: BuildingEvent | undefined;
  tab: string;
  isHovered?: boolean;
  onUpgrade?: () => void;
} & AnchorHTMLAttributes<HTMLAnchorElement>;

const OccupiedBuildingFieldContent = ({
  buildingField,
  currentBuildingFieldBuildingEvent,
  tab,
  isHovered = false,
  onUpgrade = () => {},
  ...props
}: OccupiedBuildingFieldContentProps) => {
  const { t } = useTranslation();
  const { currentVillage, shouldShowBuildingNames } = use(VillageMapContext);

  const { id: buildingFieldId, buildingId } = buildingField;
  const hasEvent = !!currentBuildingFieldBuildingEvent;

  return (
    <Link
      to={{
        pathname: `${buildingFieldId}`,
        search: `tab=${tab}`,
      }}
      aria-label={t(`BUILDINGS.${buildingId}.NAME`)}
      data-building-field-id={buildingFieldId}
      tabIndex={0}
      className={clsx(
        buildingFieldId <= 18 &&
          dynamicCellClasses({
            buildingField,
            resourceFieldComposition: currentVillage.resourceFieldComposition,
          }),
        'relative size-10 lg:size-16 rounded-full non-selectable focus:outline-hidden focus:ring-2 focus:ring-black/80 dark:focus:ring-ring border border-black/10 dark:border-border',
      )}
      {...props}
    >
      <div className="absolute absolute-centering">
        <BuildingUpgradeIndicator
          isHovered={isHovered}
          buildingField={buildingField}
          buildingEvent={currentBuildingFieldBuildingEvent}
          onUpgrade={onUpgrade}
        />
      </div>
      {shouldShowBuildingNames && (
        <span className="inline-flex flex-col lg:flex-row text-center text-3xs md:text-2xs px-0.5 md:px-1 z-10 bg-background border border-border rounded-xs whitespace-nowrap absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-[calc(50%+20px)] lg:top-[calc(50%+25px)]">
          {hasEvent && (
            <Countdown
              endsAt={
                currentBuildingFieldBuildingEvent.startsAt +
                currentBuildingFieldBuildingEvent.duration
              }
            />
          )}
          {!hasEvent && t(`BUILDINGS.${buildingId}.NAME`)}
        </span>
      )}
    </Link>
  );
};
