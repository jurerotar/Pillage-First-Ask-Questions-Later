import type { ApiHandler } from 'app/interfaces/api';
import { heroCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { Hero } from 'app/interfaces/models/game/hero';
import { z } from 'zod';

const getHeroResponseSchema = z
  .strictObject({

  })
  .transform((t) => {
    return {

    };
  });

export const getHero: ApiHandler<z.infer<typeof getHeroResponseSchema>> = async (queryClient, database) => {
  const _hero = database.selectObject('SELECT * from heroes');

  return queryClient.getQueryData<Hero>([heroCacheKey])!;
};

const getAdventurePointsResponseSchema = z
  .strictObject({
    amount: z.number(),
  });

export const getAdventurePoints: ApiHandler<z.infer<typeof getAdventurePointsResponseSchema>> = async (
  _queryClient,
  database,
) => {
  const row = database.selectObject('SELECT amount FROM adventure_points;');

  return getAdventurePointsResponseSchema.parse(row);
};
