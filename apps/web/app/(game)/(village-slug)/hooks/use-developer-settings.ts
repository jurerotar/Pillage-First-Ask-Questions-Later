import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { developerSettingsCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';

export const useDeveloperSettings = () => {
  const { apiClient } = use(ApiContext);

  const { data: developerSettings } = useSuspenseQuery({
    queryKey: [developerSettingsCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get('/developer-settings');

      return data;
    },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });

  return {
    developerSettings,
  };
};
