import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import type {
  Hero,
  HeroResourceToProduce,
} from '@pillage-first/types/models/hero';
import { heroSchema } from '@pillage-first/types/models/hero';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village.ts';
import {
  currentVillageCacheKey,
  effectsCacheKey,
  heroCacheKey,
} from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { invalidateQueries } from 'app/utils/react-query';

export const useHero = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: hero } = useSuspenseQuery({
    queryKey: [heroCacheKey],
    queryFn: async () => {
      const { data } = await fetcher('/me/hero');

      return heroSchema.parse(data);
    },
  });

  const { health, experience } = hero.stats;
  const { isHeroHome } = hero;
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
      await invalidateQueries(context, [
        [heroCacheKey],
        [effectsCacheKey, currentVillage.id],
        [currentVillageCacheKey, currentVillage.slug],
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
      await invalidateQueries(context, [
        [heroCacheKey],
        [effectsCacheKey, currentVillage.id],
        [currentVillageCacheKey, currentVillage.slug],
      ]);
    },
  });

  return {
    hero,
    experience,
    health,
    isHeroAlive,
    isHeroHome,
    updateHeroAttributes,
    updateHeroResourceToProduce,
  };
};
