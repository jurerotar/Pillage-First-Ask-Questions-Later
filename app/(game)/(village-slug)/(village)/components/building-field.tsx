import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { getBuildingFieldByBuildingFieldId } from 'app/(game)/(village-slug)/utils/building';
import type { BuildingField as BuildingFieldType } from 'app/interfaces/models/game/village';
import clsx from 'clsx';
import type React from 'react';
import { OccupiedBuildingField } from 'app/(game)/(village-slug)/(village)/components/occupied-building-field';
import { EmptyBuildingField } from 'app/(game)/(village-slug)/(village)/components/empty-building-field';

const buildingFieldIdToStyleMap = new Map<BuildingFieldType['id'], string>([
  [1, 'top-[20%] left-[33%]'],
  [2, 'top-[10%] left-[47%]'],
  [3, 'top-[17%] left-[63%]'],
  [4, 'top-[35%] left-[20%]'],
  [5, 'top-[30%] left-[43%]'],
  [6, 'top-[27%] left-[55%]'],
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
