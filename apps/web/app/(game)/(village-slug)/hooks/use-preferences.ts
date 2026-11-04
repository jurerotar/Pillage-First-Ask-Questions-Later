import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import type { Preferences } from '@pillage-first/types/models/preferences';
import { preferencesCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';
import { invalidateQueries } from 'app/utils/react-query';

type UpdatePreferenceArgs = {
  preferenceName: keyof Preferences;
  value: Preferences[keyof Preferences];
};

export const usePreferences = () => {
  const { apiClient } = use(ApiContext);

  const { data: preferences } = useSuspenseQuery({
    queryKey: [preferencesCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get('/me/preferences');

      return data;
    },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });

  const { mutate: updatePreference } = useMutation<
    void,
    Error,
    UpdatePreferenceArgs
  >({
    mutationFn: async ({ preferenceName, value }) => {
      await apiClient.patch('/me/preferences/:preferenceName', {
        path: {
          preferenceName,
        },
        body: {
          value,
        },
      });
    },
    onSuccess: async (_, _args, _onMutateResult, context) => {
      await invalidateQueries(context, [[preferencesCacheKey]]);
    },
  });

  return {
    preferences,
    updatePreference,
  };
};
