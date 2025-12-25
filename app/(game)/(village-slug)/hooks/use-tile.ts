import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { z } from 'zod';
import { ApiContext } from 'app/(game)/providers/api-provider';

const tileSchema = z.strictObject({});

export const useTile = (tileId: number) => {
  const { fetcher } = use(ApiContext);

  const { data: tile } = useSuspenseQuery({
    queryKey: ['tile', tileId],
    queryFn: async () => {
      const { data } = await fetcher(`/tiles/${tileId}`);

      return tileSchema.parse(data);
    },
  });

  return {
    tile,
  };
};
