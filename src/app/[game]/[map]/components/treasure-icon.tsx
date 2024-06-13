import { Icon, type IconProps, type TreasureTileIconType } from 'app/components/icon';
import type { OccupiedOccupiableTile, OccupiedOccupiableTile as OccupiedOccupiableTileType } from 'interfaces/models/game/tile';
import type React from 'react';

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
      wrapperClassName="absolute top-0 right-0 z-10"
      type={iconType}
    />
  );
};
