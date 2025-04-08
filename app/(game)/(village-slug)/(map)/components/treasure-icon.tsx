import { Icon, type IconProps } from 'app/components/icon';
import type React from 'react';
import type { WorldItem } from 'app/interfaces/models/game/world-item';

type TreasureIconProps = Omit<IconProps, 'type'> & {
  item: WorldItem;
};

export const TreasureIcon: React.FC<TreasureIconProps> = ({ item }) => {
  if (item.type === 'artifact') {
    return (
      <Icon
        borderVariant="orange"
        wrapperClassName="cell-icon"
        type="treasureTileArtifact"
        asCss
      />
    );
  }

  if (item.type === 'wearable') {
    // TODO: Add item rarity color once items are created
    return (
      <Icon
        borderVariant="blue"
        wrapperClassName="cell-icon"
        type="treasureTileItem"
        asCss
      />
    );
  }

  if (item.type === 'currency') {
    return (
      <Icon
        borderVariant="blue"
        wrapperClassName="cell-icon"
        type="treasureTileCurrency"
        asCss
      />
    );
  }

  if (item.type === 'resource') {
    return (
      <Icon
        borderVariant="blue"
        wrapperClassName="cell-icon"
        type="treasureTileResources"
        asCss
      />
    );
  }

  // Miscellaneous consumable items
  return (
    <Icon
      borderVariant="blue"
      wrapperClassName="cell-icon"
      type="treasureTileMiscellaneous"
      asCss
    />
  );
};
