import type { ApiHandler } from 'app/interfaces/api';
import { developerModeCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

export const getDeveloperMode: ApiHandler<{ isDeveloperModeEnabled: boolean }> = async (queryClient) => {
  const isDeveloperModeEnabled = queryClient.getQueryData<boolean>([developerModeCacheKey])! ?? false;

  return {
    isDeveloperModeEnabled,
  };
};

export const toggleDeveloperMode: ApiHandler<{ isDeveloperModeEnabled: boolean }> = async (queryClient) => {
  queryClient.setQueryData([developerModeCacheKey], (isDeveloperModeEnabled = false) => {
    return !isDeveloperModeEnabled;
  });

  const isDeveloperModeEnabled = queryClient.getQueryData<boolean>([developerModeCacheKey])! ?? false;

  return {
    isDeveloperModeEnabled,
  };
};
