import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GiBoots,
  GiBroadsword,
  GiChestArmor,
  GiHealthPotion,
  GiHorseHead,
  GiOpenTreasureChest,
  GiShield,
  GiVikingHelmet,
} from 'react-icons/gi';
import { LuListFilter } from 'react-icons/lu';
import { PiPantsBold } from 'react-icons/pi';
import type { HeroItemSlot } from '@pillage-first/types/models/hero-item';
import type { useAuctionFilters } from 'app/(game)/(village-slug)/(hero)/components/hooks/use-auction-filters';
import { SectionContent } from 'app/(game)/(village-slug)/components/building-layout';
import { Text } from 'app/components/text';
import { Badge } from 'app/components/ui/badge';
import { Button } from 'app/components/ui/button';
import { Checkbox } from 'app/components/ui/checkbox';
import { Label } from 'app/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'app/components/ui/popover';

type AuctionFiltersProps = Pick<
  ReturnType<typeof useAuctionFilters>,
  'auctionFilters' | 'onAuctionFiltersChange'
>;

type AuctionFilterCheckboxProps = {
  children: ReactNode;
  isChecked: boolean;
  label: string;
  onCheckedChange: (filter: HeroItemSlot, isChecked: boolean) => void;
  value: HeroItemSlot;
};

const AuctionFilterCheckbox = ({
  children,
  isChecked,
  label,
  onCheckedChange,
  value,
}: AuctionFilterCheckboxProps) => {
  const id = `auction-filter-${value}`;

  return (
    <div className="flex items-center gap-2 rounded-sm px-1 py-1 text-sm hover:bg-accent">
      <Checkbox
        id={id}
        checked={isChecked}
        onCheckedChange={(checked) => onCheckedChange(value, checked === true)}
      />
      <Label
        className="min-w-0 flex-1 cursor-pointer justify-between gap-3"
        htmlFor={id}
      >
        <span className="truncate">{label}</span>
        <span className="text-muted-foreground grayscale">{children}</span>
      </Label>
    </div>
  );
};

export const AuctionFilters = ({
  auctionFilters,
  onAuctionFiltersChange,
}: AuctionFiltersProps) => {
  const { t } = useTranslation();
  const activeFilters = new Set(auctionFilters);

  const updateFilter = (filter: HeroItemSlot, isChecked: boolean) => {
    onAuctionFiltersChange(
      isChecked
        ? Array.from(new Set([...auctionFilters, filter]))
        : auctionFilters.filter((value) => value !== filter),
    );
  };

  return (
    <SectionContent>
      <Text className="font-medium">{t('Filter auction offers')}</Text>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            aria-label={t('Auction filters')}
            size="sm"
            variant="outline"
          >
            <LuListFilter className="size-4" />
            {t('Auction filters')}
            <Badge variant="secondary">{auctionFilters.length}</Badge>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-72 p-3"
        >
          <div className="grid gap-1">
            <AuctionFilterCheckbox
              isChecked={activeFilters.has('head')}
              label={t('Head')}
              onCheckedChange={updateFilter}
              value="head"
            >
              <GiVikingHelmet className="size-4" />
            </AuctionFilterCheckbox>
            <AuctionFilterCheckbox
              isChecked={activeFilters.has('torso')}
              label={t('Torso')}
              onCheckedChange={updateFilter}
              value="torso"
            >
              <GiChestArmor className="size-4" />
            </AuctionFilterCheckbox>
            <AuctionFilterCheckbox
              isChecked={activeFilters.has('legs')}
              label={t('Legs')}
              onCheckedChange={updateFilter}
              value="legs"
            >
              <PiPantsBold className="size-4" />
            </AuctionFilterCheckbox>
            <AuctionFilterCheckbox
              isChecked={activeFilters.has('boots')}
              label={t('Boots')}
              onCheckedChange={updateFilter}
              value="boots"
            >
              <GiBoots className="size-4" />
            </AuctionFilterCheckbox>
            <AuctionFilterCheckbox
              isChecked={activeFilters.has('right-hand')}
              label={t('Right Hand')}
              onCheckedChange={updateFilter}
              value="right-hand"
            >
              <GiBroadsword className="size-4" />
            </AuctionFilterCheckbox>
            <AuctionFilterCheckbox
              isChecked={activeFilters.has('left-hand')}
              label={t('Left Hand')}
              onCheckedChange={updateFilter}
              value="left-hand"
            >
              <GiShield className="size-4" />
            </AuctionFilterCheckbox>
            <AuctionFilterCheckbox
              isChecked={activeFilters.has('horse')}
              label={t('Horse')}
              onCheckedChange={updateFilter}
              value="horse"
            >
              <GiHorseHead className="size-4" />
            </AuctionFilterCheckbox>
            <AuctionFilterCheckbox
              isChecked={activeFilters.has('consumable')}
              label={t('Consumable')}
              onCheckedChange={updateFilter}
              value="consumable"
            >
              <GiHealthPotion className="size-4" />
            </AuctionFilterCheckbox>
            <AuctionFilterCheckbox
              isChecked={activeFilters.has('non-equipable')}
              label={t('Artifact')}
              onCheckedChange={updateFilter}
              value="non-equipable"
            >
              <GiOpenTreasureChest className="size-4" />
            </AuctionFilterCheckbox>
          </div>
        </PopoverContent>
      </Popover>
    </SectionContent>
  );
};
