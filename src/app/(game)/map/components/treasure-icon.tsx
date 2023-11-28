import React from 'react';
import { OccupiedFreeTile as OccupiedFreeTileType, OccupiedFreeTile } from 'interfaces/models/game/tile';
import { Icon, IconProps, TreasureTileIconType } from 'components/icon';

type TreasureIconProps = Pick<OccupiedFreeTile, 'treasureType'> & Omit<IconProps, 'type'>;

const treasureTypeToIconMap = new Map<Exclude<OccupiedFreeTileType['treasureType'], null>, TreasureTileIconType>([
  ['resources', 'treasureTileResources'],
  ['currency', 'treasureTileCurrency'],
  ['artifact', 'treasureTileArtifact'],
  ['hero-item', 'treasureTileItem'],
]);

export const TreasureIcon: React.FC<TreasureIconProps> = ({ treasureType, ...rest }) => {
  const iconType = treasureTypeToIconMap.get(treasureType!)!;

  return (
    <Icon
      {...rest}
      borderVariant="blue"
      className="h-3 w-3 select-none"
      type={iconType}
    />
  );
};
