import React from 'react';
import { ResourceFieldId } from 'interfaces/models/game/village';
import clsx from 'clsx';
import { BuildingUpgradeIndicator } from 'app/[game]/components/building-upgrade-indicator';
import { getBuildingFieldByBuildingFieldId } from 'app/[game]/utils/common';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { BuildingId } from 'interfaces/models/game/building';

type ResourceFieldProps = {
  onClick: () => void;
  resourceFieldId: ResourceFieldId;
};

const resourceFieldIdToStyleMap = new Map<ResourceFieldId, string>([
  [1, 'top-[20%] left-[33%] size-[12.8%]'],
  [2, 'top-[10%] left-[47%] size-[12.8%]'],
  [3, 'top-[17%] left-[63%] size-[14.4%]'],
  [4, 'top-[35%] left-[20%] size-[12.8%]'],
  [5, 'top-[30%] left-[43%] size-[8%]'],
  [6, 'top-[27%] left-[52%] size-[9.6%]'],
  [7, 'top-[24%] left-[77%] size-[9.6%]'],
  [8, 'top-[54%] left-[14%] size-[9.6%]'],
  [9, 'top-[51%] left-[26%] size-[8%]'],
  [10, 'top-[39%] left-[69%] size-[12.8%]'],
  [11, 'top-[39%] left-[86%] size-[12.8%]'],
  [12, 'top-[68%] left-[19%] size-[9.6%]'],
  [13, 'top-[59%] left-[32%] size-[8%]'],
  [14, 'top-[71%] left-[48%] size-[8%]'],
  [15, 'top-[59%] left-[76%] size-[12.8%]'],
  [16, 'top-[77%] left-[36%] size-[12.8%]'],
  [17, 'top-[86%] left-[50%] size-[9.6%]'],
  [18, 'top-[76%] left-[62%] size-[12.8%]'],
]);

// TODO: This will eventually get replaced by graphics
const backgroundColors = new Map<BuildingId, string>([
  ['WOODCUTTER', 'bg-resources-wood'],
  ['IRON_MINE', 'bg-resources-iron'],
  ['CLAY_PIT', 'bg-resources-clay'],
  ['CROPLAND', 'bg-resources-wheat'],
]);

export const ResourceField: React.FC<ResourceFieldProps> = ({ resourceFieldId, onClick }) => {
  const { currentVillage } = useCurrentVillage();
  const { buildingId } = getBuildingFieldByBuildingFieldId(currentVillage, resourceFieldId)!;
  const backgroundColor = backgroundColors.get(buildingId);

  const styles = resourceFieldIdToStyleMap.get(resourceFieldId);

  return (
    <button
      type="button"
      className={clsx(styles, backgroundColor, 'absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-red-400')}
      data-building-field-id={resourceFieldId}
      onClick={onClick}
    >
      <BuildingUpgradeIndicator buildingFieldId={resourceFieldId} />
    </button>
  );
};
