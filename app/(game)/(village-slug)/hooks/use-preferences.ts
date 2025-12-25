import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { preferencesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import type { Preferences } from 'app/interfaces/models/game/preferences';

type UpdatePreferenceArgs = {
  preferenceName: keyof Preferences;
  value: Preferences[keyof Preferences];
};

export const usePreferences = () => {
  const { fetcher } = use(ApiContext);

  const { data: preferences } = useSuspenseQuery<Preferences>({
    queryKey: [preferencesCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<Preferences>('/me/preferences');
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
      await fetcher<Preferences>(`/me/preferences/${preferenceName}`, {
        method: 'PATCH',
        body: {
          value,
        },
      });
    },
    onSuccess: async (_, _args, _onMutateResult, context) => {
      await context.client.invalidateQueries({
        queryKey: [preferencesCacheKey],
      });
    },
  });

  return {
    preferences,
    updatePreference,
  };
};
