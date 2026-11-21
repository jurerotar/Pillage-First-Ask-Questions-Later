import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use, useSyncExternalStore } from 'react';
import {
  calculateHeroHealthAt,
  getHeroHealthRegenerationDeadline,
} from '@pillage-first/game-assets/utils/hero';
import type {
  Hero,
  HeroResourceToProduce,
} from '@pillage-first/types/models/hero';
import {
  currentVillageCacheKey,
  effectsCacheKey,
  heroCacheKey,
} from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';
import { getCurrentTime, subscribeToTimer } from 'app/(game)/utils/timer';
import { invalidateQueries } from 'app/utils/react-query';

export const useHero = () => {
  const { apiClient } = use(ApiContext);

  const { data: heroSnapshot } = useSuspenseQuery({
    queryKey: [heroCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get('/me/hero');

      return data;
    },
  });

  const { stats, nextHealthRegenerationAt, healthRegenerationInterval } =
    heroSnapshot;

  const health = useSyncExternalStore(subscribeToTimer, () =>
    calculateHeroHealthAt(
      stats.health,
      nextHealthRegenerationAt,
      healthRegenerationInterval,
      getCurrentTime(),
    ),
  );

  const hero = {
    ...heroSnapshot,
    nextHealthRegenerationAt: getHeroHealthRegenerationDeadline(
      health,
      nextHealthRegenerationAt,
      healthRegenerationInterval,
      health - stats.health,
    ),
    stats: { ...stats, health },
  };

  const { experience } = hero.stats;
  const isHeroAlive = hero.status.type !== 'dead';

  const { mutate: updateHeroAttributes } = useMutation({
    mutationFn: async (attributes: Hero['selectableAttributes']) => {
      const { data } = await apiClient.patch('/me/hero/attributes', {
        body: attributes,
      });

      return data;
    },
    onSuccess: async (
      { tileId, villageSlug },
      _args,
      _onMutateResult,
      context,
    ) => {
      await invalidateQueries(context, [
        [heroCacheKey],
        [effectsCacheKey, tileId],
        [currentVillageCacheKey, villageSlug],
      ]);
    },
  });

  const { mutate: updateHeroResourceToProduce } = useMutation({
    mutationFn: async (resource: HeroResourceToProduce) => {
      const { data } = await apiClient.patch('/me/hero/resource-to-produce', {
        body: { resource },
      });

      return data;
    },
    onSuccess: async (
      { tileId, villageSlug },
      _args,
      _onMutateResult,
      context,
    ) => {
      await invalidateQueries(context, [
        [heroCacheKey],
        [effectsCacheKey, tileId],
        [currentVillageCacheKey, villageSlug],
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
