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

const auctionFilterOptions = [
  {
    value: 'head',
    label: 'Head',
    icon: <GiVikingHelmet className="size-4" />,
  },
  {
    value: 'torso',
    label: 'Torso',
    icon: <GiChestArmor className="size-4" />,
  },
  {
    value: 'legs',
    label: 'Legs',
    icon: <PiPantsBold className="size-4" />,
  },
  {
    value: 'boots',
    label: 'Boots',
    icon: <GiBoots className="size-4" />,
  },
  {
    value: 'right-hand',
    label: 'Right Hand',
    icon: <GiBroadsword className="size-4" />,
  },
  {
    value: 'left-hand',
    label: 'Left Hand',
    icon: <GiShield className="size-4" />,
  },
  {
    value: 'horse',
    label: 'Horse',
    icon: <GiHorseHead className="size-4" />,
  },
  {
    value: 'consumable',
    label: 'Consumable',
    icon: <GiHealthPotion className="size-4" />,
  },
  {
    value: 'non-equipable',
    label: 'Artifact',
    icon: <GiOpenTreasureChest className="size-4" />,
  },
] satisfies {
  value: HeroItemSlot;
  label: string;
  icon: React.ReactNode;
}[];

const auctionFilterValues = auctionFilterOptions.map(({ value }) => value);

type AuctionFiltersProps = Pick<
  ReturnType<typeof useAuctionFilters>,
  'auctionFilters' | 'onAuctionFiltersChange'
>;

export const AuctionFilters = ({
  auctionFilters,
  onAuctionFiltersChange,
}: AuctionFiltersProps) => {
  const { t } = useTranslation();
  const activeFilters = new Set(auctionFilters);

  const updateFilter = (filter: HeroItemSlot, isChecked: boolean) => {
    onAuctionFiltersChange(
      auctionFilterValues.filter((value) =>
        value === filter ? isChecked : activeFilters.has(value),
      ),
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
            {auctionFilterOptions.map(({ value, label, icon }) => {
              const id = `auction-filter-${value}`;

              return (
                <div
                  className="flex items-center gap-2 rounded-sm px-1 py-1 text-sm hover:bg-accent"
                  key={value}
                >
                  <Checkbox
                    id={id}
                    checked={activeFilters.has(value)}
                    onCheckedChange={(checked) =>
                      updateFilter(value, checked === true)
                    }
                  />
                  <Label
                    className="min-w-0 flex-1 cursor-pointer justify-between gap-3"
                    htmlFor={id}
                  >
                    <span className="truncate">{t(label)}</span>
                    <span className="text-muted-foreground">{icon}</span>
                  </Label>
                </div>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </SectionContent>
  );
};
