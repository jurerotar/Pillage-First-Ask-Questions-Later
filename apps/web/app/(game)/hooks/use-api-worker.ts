import { useSuspenseQuery } from '@tanstack/react-query';
import type { Server } from '@pillage-first/types/models/server';
import { getApiWorkerHandle } from 'app/(game)/providers/utils/api-worker-manager';

const MIN_API_PROVIDER_SPLASH_DURATION_MS = 1_200;

const wait = (duration: number): Promise<void> => {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, duration);
  });
};

export const useApiWorker = (serverSlug: Server['slug']) => {
  const { data: apiWorkerHandle } = useSuspenseQuery({
    queryKey: ['api-worker', serverSlug],
    queryFn: async () => {
      const [apiWorkerHandle] = await Promise.all([
        getApiWorkerHandle(serverSlug),
        wait(MIN_API_PROVIDER_SPLASH_DURATION_MS),
      ]);

      return apiWorkerHandle;
    },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });

  return apiWorkerHandle;
};
