import type {
  BuildingField as BuildingFieldType,
  ResourceFieldComposition,
} from 'app/interfaces/models/game/village';
import type React from 'react';
import { useState } from 'react';
import type { Building } from 'app/interfaces/models/game/building';
import clsx from 'clsx';
import buildingFieldStyles from 'app/(game)/(village-slug)/(village)/components/occupied-building-field.module.scss';
import { useTranslation } from 'react-i18next';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { useCurrentVillageBuildingEvents } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village-building-events';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { useBookmarks } from 'app/(game)/(village-slug)/hooks/use-bookmarks';
import { Link } from 'react-router';
import { BuildingUpgradeIndicator } from 'app/(game)/(village-slug)/components/building-upgrade-indicator';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';

// The trick here is that resource buildings have different graphics based on their position, but don't change through the levels.
// Village buildings are exactly the opposite.
// const _buildingToBuildingSvgOutlineMap = new Map<
//   Building['id'],
//   Map<number, React.JSX.Element>
// >([
//   [
//     'WOODCUTTER',
//     new Map([
//       [1, <path d="" />],
//       [3, <path d="" />],
//       [5, <path d="" />],
//       [10, <path d="" />],
//       [14, <path d="" />],
//       [17, <path d="" />],
//     ]),
//   ],
//   [
//     'CLAY_PIT',
//     new Map([
//       [1, <path d="" />],
//       [5, <path d="" />],
//       [6, <path d="" />],
//       [10, <path d="" />],
//       [16, <path d="" />],
//       [18, <path d="" />],
//     ]),
//   ],
//   [
//     'IRON_MINE',
//     new Map([
//       [1, <path d="" />],
//       [4, <path d="" />],
//       [5, <path d="" />],
//       [7, <path d="" />],
//       [10, <path d="" />],
//       [11, <path d="" />],
//     ]),
//   ],
//   [
//     'WHEAT_FIELD',
//     new Map([
//       [1, <path d="" />],
//       [2, <path d="" />],
//       [3, <path d="" />],
//       [4, <path d="" />],
//       [5, <path d="" />],
//       [6, <path d="" />],
//       [7, <path d="" />],
//       [8, <path d="" />],
//       [9, <path d="" />],
//       [10, <path d="" />],
//       [11, <path d="" />],
//       [12, <path d="" />],
//       [13, <path d="" />],
//       [14, <path d="" />],
//       [15, <path d="" />],
//       [16, <path d="" />],
//       [17, <path d="" />],
//       [18, <path d="" />],
//     ]),
//   ],
// ]);

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

export const OccupiedBuildingField: React.FC<OccupiedBuildingFieldProps> = ({
  buildingField,
}) => {
  const { t: assetsT } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { preferences } = usePreferences();
  const { currentVillageBuildingEvents } = useCurrentVillageBuildingEvents();
  const isWiderThanLg = useMediaQuery('(min-width: 1024px)');
  const { resourcesPath, villagePath } = useGameNavigation();
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

  const linkPrefix = buildingFieldId > 18 ? villagePath : resourcesPath;

  const _shouldShowBuildingImage = (() => {
    if (buildingId === 'WHEAT_FIELD') {
      return ![9, 12, 13].includes(buildingFieldId);
    }

    return true;
  })();

  return (
    <div className="relative size-full">
      {/*{shouldShowBuildingImage && (*/}
      <div
        className={clsx(
          buildingFieldId <= 18 &&
            dynamicCellClasses({
              buildingField,
              resourceFieldComposition: currentVillage.RFC,
            }),
          buildingFieldId > 18 && 'border border-red-500',
          'absolute absolute-centering size-10 lg:size-16 pointer-events-none select-none rounded-full',
        )}
      />
      {/*)}*/}
      <Link
        to={`${linkPrefix}/${buildingFieldId}?tab=${tab}`}
        aria-label={assetsT(`BUILDINGS.${buildingId}.NAME`)}
        data-building-field-id={buildingFieldId}
        {...(isWiderThanLg && {
          onMouseEnter: () => setIsHovered(true),
          onMouseLeave: () => setIsHovered(false),
        })}
      >
        {/*<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">*/}
        {/*  <circle cx="50" cy="50" r="40" fill="transparent" stroke="black" strokeWidth="2" />*/}
        {/*</svg>*/}
        <div className="absolute absolute-centering size-10 lg:size-16" />
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
    </div>
  );
};
