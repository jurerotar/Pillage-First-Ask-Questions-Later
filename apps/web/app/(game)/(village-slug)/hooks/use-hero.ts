import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import type {
  Hero,
  HeroResourceToProduce,
} from '@pillage-first/types/models/hero';
import { heroSchema } from '@pillage-first/types/models/hero';
import {
  effectsCacheKey,
  heroCacheKey,
  playerVillagesCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

export const useHero = () => {
  const { fetcher } = use(ApiContext);

  const { data: hero } = useSuspenseQuery({
    queryKey: [heroCacheKey],
    queryFn: async () => {
      const { data } = await fetcher('/me/hero');

      return heroSchema.parse(data);
    },
  });

  const { health, experience } = hero.stats;
  const isHeroAlive = health > 0;

  const { mutate: updateHeroAttributes } = useMutation<
    void,
    Error,
    Hero['selectableAttributes']
  >({
    mutationFn: async (attributes) => {
      await fetcher('/me/hero/attributes', {
        method: 'PATCH',
        body: attributes,
      });
    },
    onSuccess: async (_, _args, _onMutateResult, context) => {
      await Promise.all([
        context.client.invalidateQueries({
          queryKey: [heroCacheKey],
        }),
        context.client.invalidateQueries({
          queryKey: [effectsCacheKey],
        }),
        context.client.invalidateQueries({
          queryKey: [playerVillagesCacheKey],
        }),
      ]);
    },
  });

  const { mutate: updateHeroResourceToProduce } = useMutation<
    void,
    Error,
    HeroResourceToProduce
  >({
    mutationFn: async (resource) => {
      await fetcher('/me/hero/resource-to-produce', {
        method: 'PATCH',
        body: { resource },
      });
    },
    onSuccess: async (_, _args, _onMutateResult, context) => {
      await Promise.all([
        context.client.invalidateQueries({
          queryKey: [heroCacheKey],
        }),
        context.client.invalidateQueries({
          queryKey: [effectsCacheKey],
        }),
        context.client.invalidateQueries({
          queryKey: [playerVillagesCacheKey],
        }),
      ]);
    },
  });

  return {
    hero,
    experience,
    health,
    isHeroAlive,
    updateHeroAttributes,
    updateHeroResourceToProduce,
  };
};
