import React from 'react';
import { ResourceFieldId } from 'interfaces/models/game/village';
import clsx from 'clsx';

type ResourceFieldProps = {
  resourceFieldId: ResourceFieldId;
};

const resourceFieldIdToStyleMap = new Map<ResourceFieldId, string>([

]);

export const ResourceField: React.FC<ResourceFieldProps> = ({ resourceFieldId }) => {
  const styles = resourceFieldIdToStyleMap.get(resourceFieldId);

  return (
    <div className={clsx(styles, 'absolute border border-red-400')}>
      { resourceFieldId}
    </div>
  );
};
