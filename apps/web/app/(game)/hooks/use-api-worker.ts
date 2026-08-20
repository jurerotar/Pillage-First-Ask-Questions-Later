import { useSuspenseQuery } from '@tanstack/react-query';
import type { Server } from '@pillage-first/types/models/server';
import { getApiWorkerHandle } from 'app/(game)/providers/utils/api-worker-manager';
import { wait } from 'app/utils/device';

export const useApiWorker = (serverSlug: Server['slug']) => {
  const { data: apiWorkerHandle } = useSuspenseQuery({
    queryKey: ['api-worker', serverSlug],
    queryFn: async () => {
      const [apiWorkerHandle] = await Promise.all([
        getApiWorkerHandle(serverSlug),
        // Minimal splash duration
        wait(1_200),
      ]);

      return apiWorkerHandle;
    },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });

  return apiWorkerHandle;
};
