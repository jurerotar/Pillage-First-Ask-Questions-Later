import React from 'react';
import { OccupiedOasisTile } from 'interfaces/models/game/tile';
import { Icon, IconProps } from 'components/icon';
import { Resource } from 'interfaces/models/game/resource';

type OccupiableOasisIconProps = Pick<OccupiedOasisTile, 'oasisBonus' | 'oasisType'> & Omit<IconProps, 'type'>;

export const OccupiableOasisIcon: React.FC<OccupiableOasisIconProps> = (props) => {
  const {
    oasisType,
    oasisBonus,
    ...rest
  } = props;

  // TODO: Resource combinations will have custom icons, but currently we just reuse single-resource icon
  const resourceType = (oasisType.includes('-') ? oasisType.split('-')[0] : oasisType) as Resource;

  return (
    <Icon
      {...rest}
      className="select-none"
      type={resourceType}
    />
  );
};
