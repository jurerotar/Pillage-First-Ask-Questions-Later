import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { developerSettingsSchema } from '@pillage-first/types/models/developer-settings';
import { developerSettingsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useDeveloperSettings = () => {
  const { fetcher } = use(ApiContext);

  const { data: developerSettings } = useSuspenseQuery({
    queryKey: [developerSettingsCacheKey],
    queryFn: async () => {
      const { data } = await fetcher('/developer-settings');

      return developerSettingsSchema.parse(data);
    },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });

  return developerSettings;
};
