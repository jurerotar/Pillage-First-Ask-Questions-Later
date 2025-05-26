import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { preferencesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { Preferences } from 'app/interfaces/models/game/preferences';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const usePreferences = () => {
  const { fetcher } = use(ApiContext);
  const queryClient = useQueryClient();

  const { data: preferences } = useSuspenseQuery<Preferences>({
    queryKey: [preferencesCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<Preferences>('/settings/preferences');
      return data;
    },
  });

  const { mutate: updatePreference } = useMutation<
    Preferences,
    Error,
    Partial<
      Record<keyof Pick<Preferences, 'isReducedMotionModeEnabled' | 'isAccessibilityModeEnabled' | 'shouldShowBuildingNames'>, boolean>
    >
  >({
    mutationFn: async (vars) => {
      const { data } = await fetcher<Preferences>('/settings/preferences', {
        method: 'PATCH',
        body: {
          ...vars,
        },
      });

      return data;
    },
    onSuccess: async (preferences) => {
      queryClient.setQueryData<Preferences>([preferencesCacheKey], () => {
        return preferences;
      });
    },
  });

  return {
    ...preferences,
    updatePreference,
  };
};
