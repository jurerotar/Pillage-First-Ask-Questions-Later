import {
  type TroopMovementFilterType,
  troopMovementFilterTypes,
} from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/rally-point/troop-movement-filters';
import { useFilters } from 'app/hooks/use-filters';

export const useTroopMovementFilters = () => {
  return useFilters<TroopMovementFilterType>({
    paramName: 'filters',
    defaultFilters: [...troopMovementFilterTypes],
  });
};
