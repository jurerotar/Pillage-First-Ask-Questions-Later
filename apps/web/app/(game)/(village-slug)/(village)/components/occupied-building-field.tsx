import { clsx } from 'clsx';
import { memo, use, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import type { Building } from '@pillage-first/types/models/building';
import type { BuildingField as BuildingFieldType } from '@pillage-first/types/models/building-field';
import type { ResourceFieldComposition } from '@pillage-first/types/models/resource-field-composition';
import buildingFieldStyles from 'app/(game)/(village-slug)/(village)/components/occupied-building-field.module.scss';
import { useBuildingActions } from 'app/(game)/(village-slug)/(village)/hooks/use-building-actions';
import { BuildingUpgradeIndicator } from 'app/(game)/(village-slug)/components/building-upgrade-indicator';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';
import { useBookmarks } from 'app/(game)/(village-slug)/hooks/use-bookmarks';
import { useBuildingUpgradeStatus } from 'app/(game)/(village-slug)/hooks/use-building-level-change-status';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { BuildingUpgradeStatusContextProvider } from 'app/(game)/(village-slug)/providers/building-upgrade-status-provider';
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

export const OccupiedBuildingField = memo(
  ({ buildingField }: OccupiedBuildingFieldProps) => {
    const { t } = useTranslation();
    const { currentVillage } = useCurrentVillage();
    const { preferences } = usePreferences();
    const { currentVillageBuildingEvents } = use(
      CurrentVillageBuildingQueueContext,
    );
    const isWiderThanLg = useMediaQuery('(min-width: 1024px)');
    const { bookmarks } = useBookmarks();

    const { id: buildingFieldId, buildingId } = buildingField;

    const { errors } = useBuildingUpgradeStatus(buildingField);
    const { upgradeBuilding } = useBuildingActions(buildingId, buildingFieldId);

    const onLongPress = () => {
      if (errors.length === 0) {
        upgradeBuilding();
      }
    };

    const longPress = useLongPress(onLongPress);

    const [isHovered, setIsHovered] = useState<boolean>(false);
    const { shouldShowBuildingNames } = preferences;

    const tab = bookmarks[buildingId] ?? 'default';

    const currentBuildingFieldBuildingEvent = useMemo(() => {
      return currentVillageBuildingEvents.find(
        ({ buildingFieldId: buildingEventBuildingFieldId }) =>
          buildingEventBuildingFieldId === buildingFieldId,
      );
    }, [currentVillageBuildingEvents, buildingFieldId]);

    const hasEvent = !!currentBuildingFieldBuildingEvent;

    return (
      <BuildingUpgradeStatusContextProvider buildingField={buildingField}>
        <Link
          to={{
            pathname: `${buildingFieldId}`,
            search: `tab=${tab}`,
          }}
          aria-label={t(`BUILDINGS.${buildingId}.NAME`)}
          data-building-field-id={buildingFieldId}
          tabIndex={0}
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
          className={clsx(
            buildingFieldId <= 18 &&
              dynamicCellClasses({
                buildingField,
                resourceFieldComposition:
                  currentVillage.resourceFieldComposition,
              }),
            'relative size-10 lg:size-16 rounded-full select-none focus:outline-hidden focus:ring-2 focus:ring-black/80 border border-black/10',
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
              {!hasEvent && t(`BUILDINGS.${buildingId}.NAME`)}
            </span>
          )}
        </Link>
      </BuildingUpgradeStatusContextProvider>
    );
  },
);
