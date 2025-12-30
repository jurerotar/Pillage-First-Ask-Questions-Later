import { useTranslation } from 'react-i18next';
import {
  GiBoots,
  GiBroadsword,
  GiChestArmor,
  GiHealthPotion,
  GiShield,
  GiVikingHelmet,
} from 'react-icons/gi';
import { PiPantsBold } from 'react-icons/pi';
import type { useAuctionFilters } from 'app/(game)/(village-slug)/(hero)/components/hooks/use-auction-filters';
import { SectionContent } from 'app/(game)/(village-slug)/components/building-layout';
import { Text } from 'app/components/text';
import { ToggleGroup, ToggleGroupItem } from 'app/components/ui/toggle-group';

type AuctionFiltersProps = ReturnType<typeof useAuctionFilters>;

export const AuctionFilters = ({
  auctionFilter,
  onAuctionFilterChange,
}: AuctionFiltersProps) => {
  const { t } = useTranslation();

  return (
    <SectionContent>
      <Text className="font-medium">{t('Filter auction offers')}</Text>
      <ToggleGroup
        type="single"
        value={auctionFilter}
        onValueChange={onAuctionFilterChange}
        variant="outline"
        size="sm"
        className="overflow-x-scroll scrollbar-hidden"
      >
        <ToggleGroupItem
          data-tooltip-id="general-tooltip"
          data-tooltip-content={t('Head')}
          value="head"
        >
          <GiVikingHelmet className="size-4" />
        </ToggleGroupItem>

        <ToggleGroupItem
          data-tooltip-id="general-tooltip"
          data-tooltip-content={t('Torso')}
          value="torso"
        >
          <GiChestArmor className="size-4" />
        </ToggleGroupItem>

        <ToggleGroupItem
          data-tooltip-id="general-tooltip"
          data-tooltip-content={t('Legs')}
          value="legs"
        >
          <PiPantsBold className="size-4" />
        </ToggleGroupItem>

        <ToggleGroupItem
          data-tooltip-id="general-tooltip"
          data-tooltip-content={t('Boots')}
          value="boots"
        >
          <GiBoots className="size-4" />
        </ToggleGroupItem>

        <ToggleGroupItem
          data-tooltip-id="general-tooltip"
          data-tooltip-content={t('Right Hand')}
          value="right-hand"
        >
          <GiBroadsword className="size-4" />
        </ToggleGroupItem>

        <ToggleGroupItem
          data-tooltip-id="general-tooltip"
          data-tooltip-content={t('Left Hand')}
          value="left-hand"
        >
          <GiShield className="size-4" />
        </ToggleGroupItem>

        <ToggleGroupItem
          data-tooltip-id="general-tooltip"
          data-tooltip-content={t('Consumable')}
          value="consumable"
        >
          <GiHealthPotion className="size-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    </SectionContent>
  );
};
