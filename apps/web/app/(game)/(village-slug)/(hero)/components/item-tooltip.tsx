import { clsx } from 'clsx';
import { type ReactNode, useId } from 'react';
import { useTranslation } from 'react-i18next';
import type { HeroItem } from '@pillage-first/types/models/hero-item';
import { Text } from 'app/components/text';
import { Tooltip } from 'app/components/tooltip';

type ItemTooltipProps = {
  item: HeroItem;
  children: ReactNode;
  className?: string;
};

const itemRarityClassNameByRarity = {
  common: 'text-[#ffffff]',
  uncommon: 'text-[#1eff00]',
  rare: 'text-[#0070dd]',
  epic: 'text-[#a335ee]',
} satisfies Record<HeroItem['rarity'], string>;

// t('artifact')
// t('consumable')
// t('currency')
// t('wearable')
// t('common')
// t('uncommon')
// t('rare')
// t('epic')

export const ItemTooltip = ({
  item,
  children,
  className,
}: ItemTooltipProps) => {
  const { t } = useTranslation();
  const reactId = useId();
  const tooltipId = `item-tooltip-${reactId.replaceAll(':', '')}`;
  const itemDescriptionKey = `ITEMS.${item.name}.DESCRIPTION`;
  const itemName = t(`ITEMS.${item.name}.NAME`);
  const itemDescription = t(itemDescriptionKey);

  return (
    <>
      <span
        className={clsx(
          'inline-flex w-fit cursor-help flex-col items-center gap-1',
          className,
        )}
        data-tooltip-id={tooltipId}
      >
        {children}
      </span>
      <Tooltip
        id={tooltipId}
        className="max-w-72! p-3! text-left!"
        render={() => (
          <div className="flex flex-col gap-1">
            <Text
              as="span"
              className="font-medium"
            >
              {itemName}
            </Text>
            <Text
              as="span"
              className="font-medium"
            >
              <span className={itemRarityClassNameByRarity[item.rarity]}>
                {t(item.rarity)}
              </span>{' '}
              <span className="text-muted-foreground">{t(item.category)}</span>
            </Text>
            <Text
              as="span"
              className="text-muted-foreground"
            >
              {itemDescription}
            </Text>
          </div>
        )}
      />
    </>
  );
};
