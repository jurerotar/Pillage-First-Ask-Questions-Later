import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { developerModeCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useDeveloperMode = () => {
  const { fetcher } = use(ApiContext);
  const queryClient = useQueryClient();

  const { data: isDeveloperModeActive } = useSuspenseQuery<boolean>({
    queryKey: [developerModeCacheKey],
    queryFn: async () => {
      const { data } = await fetcher<{ isDeveloperModeEnabled: boolean }>('/settings/developer-mode');
      return data.isDeveloperModeEnabled;
    },
  });

  const { mutate: toggleDeveloperMode } = useMutation<{ isDeveloperModeEnabled: boolean }, Error, void>({
    mutationFn: async () => {
      const { data } = await fetcher<{ isDeveloperModeEnabled: boolean }>('/settings/developer-mode', {
        method: 'PATCH',
      });

      return data;
    },
    onSuccess: async ({ isDeveloperModeEnabled }) => {
      queryClient.setQueryData<boolean>([developerModeCacheKey], () => {
        return isDeveloperModeEnabled;
      });
    },
  });

  return {
    isDeveloperModeActive,
    toggleDeveloperMode,
  };
};
