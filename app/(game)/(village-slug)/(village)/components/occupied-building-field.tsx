import type { ResourceFieldComposition } from 'app/interfaces/models/game/village';
import type { BuildingField as BuildingFieldType } from 'app/interfaces/models/game/building-field';
import { use } from 'react';
import { useState } from 'react';
import type { Building } from 'app/interfaces/models/game/building';
import clsx from 'clsx';
import buildingFieldStyles from 'app/(game)/(village-slug)/(village)/components/occupied-building-field.module.scss';
import { useTranslation } from 'react-i18next';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';
import { useBookmarks } from 'app/(game)/(village-slug)/hooks/use-bookmarks';
import { Link } from 'react-router';
import { BuildingUpgradeIndicator } from 'app/(game)/(village-slug)/components/building-upgrade-indicator';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { CurrentVillageBuildingQueueContext } from 'app/(game)/(village-slug)/providers/current-village-building-queue-provider';

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
  const { t: assetsT } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { preferences } = usePreferences();
  const { currentVillageBuildingEvents } = use(
    CurrentVillageBuildingQueueContext,
  );
  const isWiderThanLg = useMediaQuery('(min-width: 1024px)');
  const { bookmarks } = useBookmarks();

  const [isHovered, setIsHovered] = useState<boolean>(false);

  const { id: buildingFieldId, buildingId } = buildingField;
  const { shouldShowBuildingNames } = preferences;

  const tab = bookmarks[buildingId] ?? 'default';

  const currentBuildingFieldBuildingEvent = currentVillageBuildingEvents.find(
    ({ buildingFieldId: buildingEventBuildingFieldId }) =>
      buildingEventBuildingFieldId === buildingFieldId,
  );

  const hasEvent = !!currentBuildingFieldBuildingEvent;

  return (
    <Link
      to={{
        pathname: `${buildingFieldId}`,
        search: `tab=${tab}`,
      }}
      aria-label={assetsT(`BUILDINGS.${buildingId}.NAME`)}
      data-building-field-id={buildingFieldId}
      {...(isWiderThanLg && {
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
      })}
      className={clsx(
        buildingFieldId <= 18 &&
          dynamicCellClasses({
            buildingField,
            resourceFieldComposition: currentVillage.resourceFieldComposition,
          }),
        buildingFieldId > 18 && 'border border-red-500',
        'relative size-10 lg:size-16 rounded-full',
      )}
    >
      <div className="absolute absolute-centering">
        <BuildingUpgradeIndicator
          isHovered={isHovered}
          buildingField={buildingField}
          buildingEvent={currentBuildingFieldBuildingEvent}
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
          {!hasEvent && assetsT(`BUILDINGS.${buildingId}.NAME`)}
        </span>
      )}
    </Link>
  );
};
