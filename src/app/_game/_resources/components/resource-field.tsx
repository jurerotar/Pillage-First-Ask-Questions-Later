import React from 'react';
import { ResourceFieldId } from 'interfaces/models/game/village';
import clsx from 'clsx';
import { BuildingUpgradeIndicator } from 'app/_game/components/building-upgrade-indicator';
import { Resource } from 'interfaces/models/game/resource';

type ResourceFieldProps = {
  resourceFieldId: ResourceFieldId;
};

const resourceFieldIdToStyleMap = new Map<ResourceFieldId, string>([
  ['1', 'top-[20%] left-[33%] size-32'],
  ['2', 'top-[10%] left-[47%] size-32'],
  ['3', 'top-[17%] left-[63%] size-36'],
  ['4', 'top-[35%] left-[20%] size-32'],
  ['5', 'top-[30%] left-[43%] size-20'],
  ['6', 'top-[27%] left-[52%] size-24'],
  ['7', 'top-[24%] left-[77%] size-24'],
  ['8', 'top-[54%] left-[14%] size-24'],
  ['9', 'top-[51%] left-[26%] size-20'],
  ['10', 'top-[39%] left-[69%] size-32'],
  ['11', 'top-[39%] left-[86%] size-32'],
  ['12', 'top-[68%] left-[19%] size-24'],
  ['13', 'top-[59%] left-[32%] size-20'],
  ['14', 'top-[71%] left-[48%] size-20'],
  ['15', 'top-[59%] left-[76%] size-32'],
  ['16', 'top-[77%] left-[36%] size-32'],
  ['17', 'top-[86%] left-[50%] size-24'],
  ['18', 'top-[76%] left-[62%] size-32'],
]);

// TODO: This will eventually get replaced by graphics
const backgroundColors = new Map<Resource, string>([
  ['wood', 'bg-resources-wood'],
  ['iron', 'bg-resources-iron'],
  ['clay', 'bg-resources-clay'],
  ['wheat', 'bg-resources-wheat'],
]);

export const ResourceField: React.FC<ResourceFieldProps> = ({ resourceFieldId }) => {
  const styles = resourceFieldIdToStyleMap.get(resourceFieldId);

  return (
    <button
      type="button"
      className={clsx(styles, 'absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-red-400')}
    >
      <BuildingUpgradeIndicator buildingFieldId={resourceFieldId} />
    </button>
  );
};
