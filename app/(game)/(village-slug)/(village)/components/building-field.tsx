import { BuildingUpgradeIndicator } from 'app/(game)/(village-slug)/components/building-upgrade-indicator';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { getBuildingFieldByBuildingFieldId } from 'app/(game)/(village-slug)/utils/building';
import type { Building } from 'app/interfaces/models/game/building';
import type {
  BuildingField as BuildingFieldType,
  ReservedFieldId,
  ResourceFieldComposition,
  VillageFieldId,
} from 'app/interfaces/models/game/village';
import clsx from 'clsx';
import type React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import buildingFieldStyles from './building-field.module.scss';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { useCurrentVillageBuildingEvents } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village-building-events';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';

const buildingFieldIdToStyleMap = new Map<BuildingFieldType['id'], string>([
  [1, 'top-[20%] left-[33%]'],
  [2, 'top-[10%] left-[47%]'],
  [3, 'top-[17%] left-[63%]'],
  [4, 'top-[35%] left-[20%]'],
  [5, 'top-[30%] left-[43%]'],
  [6, 'top-[27%] left-[52%]'],
  [7, 'top-[24%] left-[77%]'],
  [8, 'top-[54%] left-[14%]'],
  [9, 'top-[51%] left-[26%]'],
  [10, 'top-[39%] left-[69%]'],
  [11, 'top-[39%] left-[86%]'],
  [12, 'top-[68%] left-[19%]'],
  [13, 'top-[67%] left-[29%]'],
  [14, 'top-[71%] left-[48%]'],
  [15, 'top-[59%] left-[76%]'],
  [16, 'top-[77%] left-[36%]'],
  [17, 'top-[86%] left-[50%]'],
  [18, 'top-[76%] left-[62%]'],
  [19, 'top-[33%] left-[26%] border border-red-400'],
  [20, 'top-[24%] left-[36%] border border-red-400'],
  [21, 'top-[18%] left-[47%] border border-red-400'],
  [22, 'top-[19%] left-[57%] border border-red-400'],
  [23, 'top-[22%] left-[68%] border border-red-400'],
  [24, 'top-[35%] left-[76%] border border-red-400'],
  [25, 'top-[47%] left-[79%] border border-red-400'],
  [26, 'top-[61%] left-[80%] border border-red-400'],
  [27, 'top-[73%] left-[76%] border border-red-400'],
  [28, 'top-[84%] left-[66%] border border-red-400'],
  [29, 'top-[75%] left-[57%] border border-red-400'],
  [30, 'top-[90%] left-[51%] border border-red-400'],
  [31, 'top-[86%] left-[35%] border border-red-400'],
  [32, 'top-[73%] left-[22%] border border-red-400'],
  [33, 'top-[59%] left-[17%] border border-red-400'],
  [34, 'top-[44%] left-[19%] border border-red-400'],
  [35, 'top-[62%] left-[48%] border border-red-400'],
  [36, 'top-[53%] left-[36%] border border-red-400'],
  [37, 'top-[42%] left-[42%] border border-red-400'],
  [38, 'top-[37%] left-[53%] border border-red-400'],
  [39, 'top-[51%] left-[64%] border border-red-400'],
  [40, 'top-[83%] left-[81%] border border-red-400'],
]);

const buildingToBuildingLevelToGraphicVariantMap = new Map<Building['id'], Map<number, string[]>>([
  [
    'MAIN_BUILDING',
    new Map([
      [20, [buildingFieldStyles['building-village-main-building-tier-3']]],
      [10, [buildingFieldStyles['building-village-main-building-tier-2']]],
    ]),
  ],
]);

type EmptyBuildingFieldProps = {
  buildingFieldId: BuildingFieldType['id'];
};

const EmptyBuildingField: React.FC<EmptyBuildingFieldProps> = ({ buildingFieldId }) => {
  const styles = buildingFieldIdToStyleMap.get(buildingFieldId);

  return (
    <Link
      to={`${buildingFieldId}`}
      className={clsx(
        styles,
        'absolute flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-red-400 md:size-16',
      )}
      data-building-field-id={buildingFieldId}
    >
      {buildingFieldId}
    </Link>
  );
};

const transformBuildingIdIntoCssClass = (buildingId: Building['id']): string => {
  return buildingId.toLowerCase().replaceAll('_', '-');
};

type DynamicCellClassesArgs = {
  buildingField: BuildingFieldType;
  resourceFieldComposition: ResourceFieldComposition;
  level: number;
};

const dynamicCellClasses = ({ buildingField, resourceFieldComposition, level }: DynamicCellClassesArgs): string => {
  const { buildingId, id } = buildingField;
  const isResourceField = id <= 18;

  if (isResourceField) {
    return clsx(
      buildingFieldStyles.building,
      buildingFieldStyles['building-resource'],
      buildingFieldStyles[`building-resource-${id}`],
      buildingFieldStyles[`building-resource-${resourceFieldComposition}`],
      buildingFieldStyles[`building-resource-${resourceFieldComposition}-${id}`],
    );
  }

  const buildingIdToCssClass = transformBuildingIdIntoCssClass(buildingId);
  const buildingLevelMap = buildingToBuildingLevelToGraphicVariantMap.get(buildingId);

  const buildingLevelVariant = buildingLevelMap
    ? (() => {
        for (const [levelThreshold, graphicClass] of buildingLevelMap) {
          if (level >= levelThreshold) {
            return graphicClass;
          }
        }
        return null;
      })()
    : null;

  return clsx(buildingFieldStyles.building, buildingFieldStyles[`building-village-${buildingIdToCssClass}`], buildingLevelVariant);
};

type OccupiedBuildingFieldProps = {
  buildingField: BuildingFieldType;
};

const OccupiedBuildingField: React.FC<OccupiedBuildingFieldProps> = ({ buildingField }) => {
  const { t: assetsT } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { shouldShowBuildingNames } = usePreferences();
  const { currentVillageBuildingEvents } = useCurrentVillageBuildingEvents();
  const { id: buildingFieldId, buildingId, level } = buildingField;

  const currentBuildingFieldBuildingEvent = currentVillageBuildingEvents.find(
    ({ buildingFieldId: buildingEventBuildingFieldId }) => buildingEventBuildingFieldId === buildingFieldId,
  );

  const hasEvent = !!currentBuildingFieldBuildingEvent;

  const styles = buildingFieldIdToStyleMap.get(buildingFieldId as VillageFieldId | ReservedFieldId);

  const [isHovered, setIsHovered] = useState<boolean>(false);

  return (
    <Link
      to={`${buildingFieldId}`}
      aria-label={assetsT(`BUILDINGS.${buildingId}.NAME`)}
      className={clsx(
        styles,
        dynamicCellClasses({ buildingField, resourceFieldComposition: currentVillage.RFC, level }),
        'absolute flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full md:size-16 bg-contain',
      )}
      data-building-field-id={buildingFieldId}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <BuildingUpgradeIndicator
        isHovered={isHovered}
        buildingFieldId={buildingFieldId}
      />
      {shouldShowBuildingNames && (
        <span className="inline-flex flex-col lg:flex-row text-center text-3xs md:text-2xs px-0.5 md:px-1 z-10 bg-white border border-gray-200 rounded-xs whitespace-nowrap absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-full">
          {hasEvent && <Countdown endsAt={currentBuildingFieldBuildingEvent.startsAt + currentBuildingFieldBuildingEvent.duration} />}
          {!hasEvent && assetsT(`BUILDINGS.${buildingId}.NAME`)}
        </span>
      )}
    </Link>
  );
};

type BuildingFieldProps = {
  buildingFieldId: BuildingFieldType['id'];
};

export const BuildingField: React.FC<BuildingFieldProps> = ({ buildingFieldId }) => {
  const { currentVillage } = useCurrentVillage();

  const buildingField = getBuildingFieldByBuildingFieldId(currentVillage, buildingFieldId);

  if (buildingField === null) {
    return <EmptyBuildingField buildingFieldId={buildingFieldId} />;
  }

  return <OccupiedBuildingField buildingField={buildingField} />;
};
