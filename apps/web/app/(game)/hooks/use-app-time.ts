import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { z } from 'zod';
import { appTimeCacheKey } from 'app/(game)/constants/query-keys.ts';
import { ApiContext } from 'app/(game)/providers/api-provider.tsx';

const appTimeSchema = z.strictObject({
  currentTime: z.number(),
});

export const useAppTime = () => {
  const { fetcher } = use(ApiContext);

  const { data: appTime } = useSuspenseQuery({
    queryKey: [appTimeCacheKey],
    queryFn: async () => {
      const { data } = await fetcher('/events/current-time');

      const { currentTime } = appTimeSchema.parse(data);
      return currentTime;
    },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });

  return {
    appTime,
  };
};
