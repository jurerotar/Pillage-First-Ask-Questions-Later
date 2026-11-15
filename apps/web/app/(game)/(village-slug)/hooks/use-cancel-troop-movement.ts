import { useMutation } from '@tanstack/react-query';
import { use } from 'react';
import { troopMovementsCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';
import { invalidateQueries } from 'app/utils/react-query';

export const useCancelTroopMovement = () => {
  const { apiClient } = use(ApiContext);

  return useMutation({
    mutationFn: async (eventId: number) => {
      await apiClient.delete('/troop-movements/:eventId', {
        path: { eventId },
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [[troopMovementsCacheKey]]);
    },
  });
};
