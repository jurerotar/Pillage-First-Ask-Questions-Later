import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { z } from 'zod';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { resourceSchema } from 'app/interfaces/models/game/resource';
import type { Tile } from 'app/interfaces/models/game/tile';

const oasisBonusesSchema = z.strictObject({
  resource: resourceSchema,
  bonus: z.union([z.literal(25), z.literal(50)]),
});

export const useOasisBonuses = (tileId: Tile['id']) => {
  const { fetcher } = use(ApiContext);

  const { data: oasisBonuses } = useSuspenseQuery({
    queryKey: ['oasis-bonuses', tileId],
    queryFn: async () => {
      const { data } = await fetcher(`/tiles/${tileId}/bonuses`);

      return z.array(oasisBonusesSchema).parse(data);
    },
  });

  return {
    oasisBonuses,
  };
};
