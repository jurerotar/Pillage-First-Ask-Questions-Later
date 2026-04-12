import type { HeroItemSlot } from '@pillage-first/types/models/hero-item';
import { useFilters } from 'app/hooks/use-filters';

const auctionFilterSlots: HeroItemSlot[] = [
  'head',
  'torso',
  'legs',
  'boots',
  'right-hand',
  'left-hand',
  'horse',
  'consumable',
];

export const useAuctionFilters = () => {
  const { filters, onFiltersChange, page, handlePageChange } =
    useFilters<HeroItemSlot>({
      paramName: 'slot',
      defaultFilters: [...auctionFilterSlots],
    });

  return {
    auctionFilters: filters,
    onAuctionFiltersChange: onFiltersChange,
    page,
    handlePageChange,
  };
};
