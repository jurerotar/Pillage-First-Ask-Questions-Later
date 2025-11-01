import { useState } from 'react';
import type { HeroItem } from 'app/interfaces/models/game/hero-item';

export const useAuctionFilters = () => {
  const [auctionFilter, setAuctionFilter] = useState<HeroItem['slot'] | ''>('');

  const onAuctionFilterChange = (filter: HeroItem['slot'] | '') => {
    setAuctionFilter(filter);
  };

  return {
    auctionFilter,
    onAuctionFilterChange,
  };
};
