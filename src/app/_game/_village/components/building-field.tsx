import React from 'react';
import { BuildingField as BuildingFieldType, ReservedFieldId, VillageFieldId } from 'interfaces/models/game/village';
import clsx from 'clsx';
import { BuildingUpgradeIndicator } from 'app/_game/components/building-upgrade-indicator';
import { getBuildingFieldByBuildingFieldId } from 'utils/game/common';
import { useCurrentVillage } from 'hooks/game/use-current-village';
import { useDialog } from 'hooks/utils/use-dialog';

const buildingFieldIdToStyleMap = new Map<VillageFieldId | ReservedFieldId, string>([
  [19, 'top-[33%] left-[26%]'],
  [20, 'top-[24%] left-[36%]'],
  [21, 'top-[18%] left-[47%]'],
  [22, 'top-[19%] left-[57%]'],
  [23, 'top-[22%] left-[68%]'],
  [24, 'top-[35%] left-[76%]'],
  [25, 'top-[47%] left-[79%]'],
  [26, 'top-[61%] left-[80%]'],
  [27, 'top-[73%] left-[76%]'],
  [28, 'top-[84%] left-[66%]'],
  [29, 'top-[75%] left-[57%]'],
  [30, 'top-[90%] left-[51%]'],
  [31, 'top-[86%] left-[35%]'],
  [32, 'top-[73%] left-[22%]'],
  [33, 'top-[59%] left-[17%]'],
  [34, 'top-[44%] left-[19%]'],
  [35, 'top-[62%] left-[48%]'],
  [36, 'top-[53%] left-[36%]'],
  [37, 'top-[42%] left-[42%]'],
  [38, 'top-[37%] left-[53%]'],
  [39, 'top-[51%] left-[64%]'],
  [40, 'top-[83%] left-[81%]'],
]);

type EmptyBuildingFieldProps = {
  buildingFieldId: VillageFieldId;
};

const EmptyBuildingField: React.FC<EmptyBuildingFieldProps> = ({ buildingFieldId }) => {
  const {} = useDialog();

  const styles = buildingFieldIdToStyleMap.get(buildingFieldId);

  return (
    <button
      type="button"
      className={clsx(styles, 'absolute size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-red-400')}
      data-building-field-id={buildingFieldId}
    >
      {buildingFieldId}
    </button>
  )
};

type OccupiedBuildingFieldProps = {
  buildingField: BuildingFieldType;
};

const OccupiedBuildingField: React.FC<OccupiedBuildingFieldProps> = ({ buildingField }) => {
  const { buildingFieldId } = buildingField;

  const styles = buildingFieldIdToStyleMap.get(buildingFieldId as VillageFieldId | ReservedFieldId);

  return (
    <button
      type="button"
      className={clsx(styles, 'absolute size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-red-400')}
      data-building-field-id={buildingFieldId}
    >
      <BuildingUpgradeIndicator buildingFieldId={buildingFieldId} />
    </button>
  );
};

type BuildingFieldProps = {
  buildingFieldId: VillageFieldId;
};

export const BuildingField: React.FC<BuildingFieldProps> = ({ buildingFieldId }) => {
  const { currentVillage } = useCurrentVillage();

  const buildingField = getBuildingFieldByBuildingFieldId(currentVillage, buildingFieldId);

  if (buildingField === null) {
    return <EmptyBuildingField buildingFieldId={buildingFieldId} />
  }

  return <OccupiedBuildingField buildingField={buildingField} />
};
