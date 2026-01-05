import type { ComponentProps } from 'react';
import { BorderIndicator } from 'app/(game)/(village-slug)/components/border-indicator';
import { getItemDefinition } from 'app/assets/utils/items';
import { Icon } from 'app/components/icon';
import type { HeroItem } from 'app/interfaces/models/game/hero-item';

type TreasureIconProps = Omit<ComponentProps<typeof Icon>, 'type'> & {
  itemId: HeroItem['id'];
};

const itemTypeToIconTypeMap = new Map<
  HeroItem['category'],
  ComponentProps<typeof Icon>['type']
>([
  ['artifact', 'treasureTileArtifact'],
  ['wearable', 'treasureTileItem'],
  ['currency', 'treasureTileCurrency'],
  ['resource', 'treasureTileResources'],
]);

export const TreasureIcon = ({ itemId, className }: TreasureIconProps) => {
  const item = getItemDefinition(itemId);

  const iconType =
    itemTypeToIconTypeMap.get(item.category) ?? 'treasureTileMiscellaneous';

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
