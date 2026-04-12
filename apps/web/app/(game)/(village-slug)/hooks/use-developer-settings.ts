import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import type { DeveloperSettings } from '@pillage-first/types/models/developer-settings';
import { developerSettingsSchema } from '@pillage-first/types/models/developer-settings';
import type { HeroItem } from '@pillage-first/types/models/hero-item';
import type { Resource } from '@pillage-first/types/models/resource';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village.ts';
import { useHero } from 'app/(game)/(village-slug)/hooks/use-hero';
import { VillageSlugContext } from 'app/(game)/(village-slug)/providers/village-slug-provider';
import {
  currentVillageCacheKey,
  developerSettingsCacheKey,
  effectsCacheKey,
  heroCacheKey,
  heroInventoryCacheKey,
  heroLoadoutCacheKey,
  villageTroopsCacheKey,
} from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { invalidateQueries } from 'app/utils/react-query';

type UpdateDeveloperSettingArgs = {
  developerSettingName: keyof DeveloperSettings;
  value: DeveloperSettings[keyof DeveloperSettings];
};

type UpdateVillageResourcesArgs = {
  villageId: number;
  resource: Resource;
  amount: 100 | 1000 | 10000;
  direction: 'add' | 'subtract';
};

type SpawnHeroItemArgs = {
  itemId: HeroItem['id'];
  amount: number;
};

export const useDeveloperSettings = () => {
  const { fetcher } = use(ApiContext);
  const { villageSlug } = use(VillageSlugContext);
  const { hero } = useHero();
  const { currentVillage } = useCurrentVillage();

  const { data: developerSettings } = useSuspenseQuery({
    queryKey: [developerSettingsCacheKey],
    queryFn: async () => {
      const { data } = await fetcher('/developer-settings');

      return developerSettingsSchema.parse(data);
    },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });

  const { mutate: updateDeveloperSetting } = useMutation<
    void,
    Error,
    UpdateDeveloperSettingArgs
  >({
    mutationFn: async ({ developerSettingName, value }) => {
      await fetcher(`/developer-settings/${developerSettingName}`, {
        method: 'PATCH',
        body: {
          value,
        },
      });
    },
    onSuccess: async (_, _args, _onMutateResult, context) => {
      await invalidateQueries(context, [[developerSettingsCacheKey]]);
    },
  });

  const { mutate: updateVillageResources } = useMutation<
    void,
    Error,
    UpdateVillageResourcesArgs
  >({
    mutationFn: async ({ villageId, resource, amount, direction }) => {
      await fetcher(`/developer-settings/${villageId}/resources`, {
        method: 'PATCH',
        body: {
          resource,
          amount,
          direction,
        },
      });
    },
    onSuccess: async (_, _args, _onMutateResult, context) => {
      await invalidateQueries(context, [[currentVillageCacheKey, villageSlug]]);
    },
  });

  const { mutate: spawnHeroItem } = useMutation<void, Error, SpawnHeroItemArgs>(
    {
      mutationFn: async ({ itemId, amount }) => {
        await fetcher(`/developer-settings/${hero.id}/spawn-item`, {
          method: 'PATCH',
          body: {
            itemId,
            amount,
          },
        });
      },
      onSuccess: async (_, _args, _onMutateResult, context) => {
        await invalidateQueries(context, [
          [heroLoadoutCacheKey],
          [heroInventoryCacheKey],
        ]);
      },
    },
  );

  const { mutate: incrementHeroAdventurePoints } = useMutation<void>({
    mutationFn: async () => {
      await fetcher(
        `/developer-settings/${hero.id}/increment-adventure-points`,
        {
          method: 'PATCH',
        },
      );
    },
    onSuccess: async (_, _args, _onMutateResult, context) => {
      await invalidateQueries(context, [['adventure-points']]);
    },
  });

  const { mutate: levelUpHero } = useMutation<void>({
    mutationFn: async () => {
      await fetcher(`/developer-settings/${hero.id}/level-up`, {
        method: 'PATCH',
      });
    },
    onSuccess: async (_, _args, _onMutateResult, context) => {
      await invalidateQueries(context, [[heroCacheKey]]);
    },
  });

  const { mutate: killHero } = useMutation<void>({
    mutationFn: async () => {
      await fetcher(`/developer-settings/${hero.id}/kill`, {
        method: 'PATCH',
      });
    },
    onSuccess: async (_, _args, _onMutateResult, context) => {
      await invalidateQueries(context, [
        [heroCacheKey],
        [villageTroopsCacheKey, currentVillage.id],
        [effectsCacheKey, currentVillage.id],
      ]);
    },
  });

  return {
    developerSettings,
    updateDeveloperSetting,
    updateVillageResources,
    spawnHeroItem,
    levelUpHero,
    incrementHeroAdventurePoints,
    killHero,
  };
};
