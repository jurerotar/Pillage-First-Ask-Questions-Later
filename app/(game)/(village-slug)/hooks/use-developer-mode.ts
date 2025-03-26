import { useQuery, useQueryClient } from '@tanstack/react-query';
import { developerModeCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

export const useDeveloperMode = () => {
  const queryClient = useQueryClient();

  const { data: isDeveloperModeActive } = useQuery<boolean>({
    queryKey: [developerModeCacheKey],
    initialData: false,
  });

  const toggleDeveloperMode = () => {
    queryClient.setQueryData<boolean>([developerModeCacheKey], !isDeveloperModeActive);
  };

  return {
    isDeveloperModeActive,
    toggleDeveloperMode,
  };
};
