import { useSuspenseQuery } from '@tanstack/react-query';
import type { Server } from '@pillage-first/types/models/server';
import { getApiWorkerHandle } from 'app/(game)/providers/utils/api-worker-manager';

export const useApiWorker = (serverSlug: Server['slug']) => {
  const { data: apiWorkerHandle } = useSuspenseQuery({
    queryKey: ['api-worker', serverSlug],
    queryFn: async () => getApiWorkerHandle(serverSlug),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });

  return apiWorkerHandle;
};
