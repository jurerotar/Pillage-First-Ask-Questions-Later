import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { z } from 'zod';
import { ApiContext } from 'app/(game)/providers/api-provider';

const getPlayerInfoSchema = z.strictObject({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  tribe: z.string(),
  faction: z.string().nullable(),
});

export const usePlayerData = (
  serverSlug: string,
  villageSlug: string,
  playerSlug: string,
) => {
  const { fetcher } = use(ApiContext);

  const { data: playerInfo } = useSuspenseQuery({
    queryKey: ['player-info', serverSlug, villageSlug, playerSlug],
    queryFn: async () => {
      const response = await fetcher(
        `/${serverSlug}/${villageSlug}/players/${playerSlug}`,
      );
      return getPlayerInfoSchema.parse(response.data);
    },
  });

  return {
    playerInfo,
  };
};
