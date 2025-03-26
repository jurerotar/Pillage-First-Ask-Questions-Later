import { Icon, type IconProps } from 'app/components/icon';
import type React from 'react';
import type { WorldItem } from 'app/interfaces/models/game/world-item';

const treasureIconClassName = 'size-3 select-none';
const treasureIconWrapperClassName = 'absolute top-0 right-0 z-20';

type TreasureIconProps = Omit<IconProps, 'type'> & {
  item: WorldItem;
};

export const TreasureIcon: React.FC<TreasureIconProps> = ({ item }) => {
  if (item.type === 'artifact') {
    return (
      <Icon
        borderVariant="orange"
        className={treasureIconClassName}
        wrapperClassName={treasureIconWrapperClassName}
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
        className={treasureIconClassName}
        wrapperClassName={treasureIconWrapperClassName}
        type="treasureTileItem"
        asCss
      />
    );
  }

  if (item.type === 'currency') {
    return (
      <Icon
        borderVariant="blue"
        className={treasureIconClassName}
        wrapperClassName={treasureIconWrapperClassName}
        type="treasureTileCurrency"
        asCss
      />
    );
  }

  if (item.type === 'resource') {
    return (
      <Icon
        borderVariant="blue"
        className={treasureIconClassName}
        wrapperClassName={treasureIconWrapperClassName}
        type="treasureTileResources"
        asCss
      />
    );
  }

  // Miscellaneous consumable items
  return (
    <Icon
      borderVariant="blue"
      className={treasureIconClassName}
      wrapperClassName={treasureIconWrapperClassName}
      type="treasureTileMiscellaneous"
      asCss
    />
  );
};
