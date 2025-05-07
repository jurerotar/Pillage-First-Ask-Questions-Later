import { Icon, type IconProps } from 'app/components/icon';
import type React from 'react';
import type { WorldItem } from 'app/interfaces/models/game/world-item';

type TreasureIconProps = Omit<IconProps, 'type'> & {
  item: WorldItem;
};

export const TreasureIcon: React.FC<TreasureIconProps> = ({ item, className }) => {
  if (item.type === 'artifact') {
    return (
      <Icon
        borderVariant="orange"
        wrapperClassName={className}
        type="treasureTileArtifact"
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
      />
    );
  }

  if (item.type === 'currency') {
    return (
      <Icon
        borderVariant="blue"
        wrapperClassName={className}
        type="treasureTileCurrency"
      />
    );
  }

  if (item.type === 'resource') {
    return (
      <Icon
        borderVariant="blue"
        wrapperClassName={className}
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
    />
  );
};
