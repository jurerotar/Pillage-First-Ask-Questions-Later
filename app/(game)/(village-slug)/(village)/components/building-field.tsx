import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { getBuildingFieldByBuildingFieldId } from 'app/(game)/(village-slug)/utils/building';
import type { BuildingField as BuildingFieldType } from 'app/interfaces/models/game/village';
import clsx from 'clsx';
import type React from 'react';
import { OccupiedBuildingField } from 'app/(game)/(village-slug)/(village)/components/occupied-building-field';
import { EmptyBuildingField } from 'app/(game)/(village-slug)/(village)/components/empty-building-field';

const buildingFieldIdToStyleMap = new Map<BuildingFieldType['id'], string>([
  [1, 'top-[19%] left-[29%]'],
  [2, 'top-[9%] left-[45%]'],
  [3, 'top-[16%] left-[63%]'],
  [4, 'top-[34%] left-[19%]'],
  [5, 'top-[32%] left-[39%]'],
  [6, 'top-[26%] left-[54%]'],
  [7, 'top-[24%] left-[76%]'],
  [8, 'top-[54%] left-[13%]'],
  [9, 'top-[50%] left-[25%]'],
  [10, 'top-[38%] left-[67%]'],
  [11, 'top-[40%] left-[85%]'],
  [12, 'top-[70%] left-[17%]'],
  [13, 'top-[67%] left-[28%]'],
  [14, 'top-[71%] left-[46%]'],
  [15, 'top-[59%] left-[74%]'],
  [16, 'top-[84%] left-[33%]'],
  [17, 'top-[89%] left-[48%]'],
  [18, 'top-[76%] left-[62%]'],
  [19, 'top-[33%] left-[28%]'],
  [20, 'top-[24%] left-[38%]'],
  [21, 'top-[18%] left-[49%]'],
  [22, 'top-[19%] left-[60%]'],
  [23, 'top-[22%] left-[70%]'],
  [24, 'top-[35%] left-[78%]'],
  [25, 'top-[47%] left-[81%]'],
  [26, 'top-[61%] left-[82%]'],
  [27, 'top-[73%] left-[78%]'],
  [28, 'top-[84%] left-[68%]'],
  [29, 'top-[75%] left-[59%]'],
  [30, 'top-[90%] left-[53%]'],
  [31, 'top-[86%] left-[37%]'],
  [32, 'top-[73%] left-[24%]'],
  [33, 'top-[59%] left-[19%]'],
  [34, 'top-[44%] left-[21%]'],
  [35, 'top-[65%] left-[48%]'],
  [36, 'top-[53%] left-[38%]'],
  [37, 'top-[42%] left-[44%]'],
  [38, 'top-[37%] left-[55%]'],
  [39, 'top-[51%] left-[66%]'],
  [40, 'top-[87%] left-[85%]'],
]);

type BuildingFieldProps = {
  buildingFieldId: BuildingFieldType['id'];
};

export const BuildingField: React.FC<BuildingFieldProps> = ({
  buildingFieldId,
}) => {
  const { currentVillage } = useCurrentVillage();

  const buildingField = getBuildingFieldByBuildingFieldId(
    currentVillage,
    buildingFieldId,
  );

  const positioningStyles = buildingFieldIdToStyleMap.get(buildingFieldId);

  return (
    <div
      className={clsx(
        positioningStyles,
        'absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center',
      )}
    >
      {buildingField === null ? (
        <EmptyBuildingField buildingFieldId={buildingFieldId} />
      ) : (
        <OccupiedBuildingField buildingField={buildingField} />
      )}
    </div>
  );
};
