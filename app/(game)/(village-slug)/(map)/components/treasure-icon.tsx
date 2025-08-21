import { Icon } from 'app/components/icon';
import type React from 'react';
import type { WorldItem } from 'app/interfaces/models/game/world-item';
import { BorderIndicator } from 'app/(game)/(village-slug)/components/border-indicator';

type TreasureIconProps = Omit<React.ComponentProps<typeof Icon>, 'type'> & {
  item: WorldItem;
};

const itemTypeToIconTypeMap = new Map<
  WorldItem['type'],
  React.ComponentProps<typeof Icon>['type']
>([
  ['artifact', 'treasureTileArtifact'],
  ['wearable', 'treasureTileItem'],
  ['currency', 'treasureTileCurrency'],
  ['resource', 'treasureTileResources'],
]);

export const TreasureIcon: React.FC<TreasureIconProps> = ({
  item,
  className,
}) => {
  const iconType =
    itemTypeToIconTypeMap.get(item.type) ?? 'treasureTileMiscellaneous';

  return (
    <BorderIndicator
      className={className}
      variant="blue"
    >
      <Icon
        type={iconType}
        shouldShowTooltip={false}
      />
    </BorderIndicator>
  );
};
