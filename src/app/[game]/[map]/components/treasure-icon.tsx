import React from 'react';
import { OccupiedOccupiableTile as OccupiedOccupiableTileType, OccupiedOccupiableTile } from 'interfaces/models/game/tile';
import { Icon, IconProps, TreasureTileIconType } from 'app/components/icon';

type TreasureIconProps = Pick<OccupiedOccupiableTile, 'treasureType'> & Omit<IconProps, 'type'>;

const treasureTypeToIconMap = new Map<Exclude<OccupiedOccupiableTileType['treasureType'], null>, TreasureTileIconType>([
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
      className="size-3 select-none"
      type={iconType}
    />
  );
};
