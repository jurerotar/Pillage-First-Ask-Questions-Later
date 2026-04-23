import type { HistoryEvent } from 'app/(game)/(village-slug)/hooks/use-events-history';
import { useFilters } from 'app/hooks/use-filters';

export const useEventFilters = () => {
  return useFilters<HistoryEvent['type']>({
    paramName: 'types',
  });
};
