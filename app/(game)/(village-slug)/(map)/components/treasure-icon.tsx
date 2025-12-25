import type { ComponentProps } from 'react';
import { BorderIndicator } from 'app/(game)/(village-slug)/components/border-indicator';
import { Icon } from 'app/components/icon';
import type { WorldItem } from 'app/interfaces/models/game/world-item';

type TreasureIconProps = Omit<ComponentProps<typeof Icon>, 'type'> & {
  item: WorldItem;
};

const itemTypeToIconTypeMap = new Map<
  WorldItem['type'],
  ComponentProps<typeof Icon>['type']
>([
  ['artifact', 'treasureTileArtifact'],
  ['wearable', 'treasureTileItem'],
  ['currency', 'treasureTileCurrency'],
  ['resource', 'treasureTileResources'],
]);

export const TreasureIcon = ({ item, className }: TreasureIconProps) => {
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
