import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { z } from 'zod';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { tileSchema } from 'app/interfaces/models/game/tile';

// We don't save border tiles to db, so they come back as null;
const mapSchema = tileSchema.nullable();

export const useMap = () => {
  const { fetcher } = use(ApiContext);

  const { data: map } = useSuspenseQuery({
    queryKey: ['tiles'],
    queryFn: async () => {
      const { data } = await fetcher('/tiles');

      return z.array(mapSchema).parse(data);
    },
  });

  return {
    map,
  };
};
