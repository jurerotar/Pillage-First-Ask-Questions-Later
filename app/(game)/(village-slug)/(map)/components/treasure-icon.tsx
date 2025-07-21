import { Icon } from 'app/components/icon';
import type React from 'react';
import type { WorldItem } from 'app/interfaces/models/game/world-item';

type TreasureIconProps = Omit<React.ComponentProps<typeof Icon>, 'type'> & {
  item: WorldItem;
};

export const TreasureIcon: React.FC<TreasureIconProps> = ({
  item,
  className,
}) => {
  if (item.type === 'artifact') {
    return (
      <Icon
        borderVariant="orange"
        wrapperClassName={className}
        type="treasureTileArtifact"
        shouldShowTooltip={false}
      />
    );
  }

  if (item.type === 'wearable') {
    // TODO: Add item rarity color once items are created
    return (
      <Icon
        borderVariant="blue"
        wrapperClassName={className}
        type="treasureTileItem"
        shouldShowTooltip={false}
      />
    );
  }

  if (item.type === 'currency') {
    return (
      <Icon
        borderVariant="blue"
        wrapperClassName={className}
        type="treasureTileCurrency"
        shouldShowTooltip={false}
      />
    );
  }

  if (item.type === 'resource') {
    return (
      <Icon
        borderVariant="blue"
        wrapperClassName={className}
        shouldShowTooltip={false}
        type="treasureTileResources"
      />
    );
  }

  // Miscellaneous consumable items
  return (
    <Icon
      borderVariant="blue"
      wrapperClassName={className}
      type="treasureTileMiscellaneous"
      shouldShowTooltip={false}
    />
  );
};
