import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import type { Building } from '@pillage-first/types/models/building';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import type { Village } from '@pillage-first/types/models/village';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import {
  currentVillageCacheKey,
  eventsCacheKey,
  scheduledBuildingUpgradesCacheKey,
} from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { invalidateQueries } from 'app/utils/react-query';

export type ScheduledBuildingUpgrade = {
  type: 'scheduledBuildingUpgrade';
  id: number;
  buildingId: Building['id'];
  villageId: Village['id'];
  buildingFieldId: BuildingField['id'];
  level: number;
  previousLevel: number;
};

export const useScheduledBuildingUpgrades = () => {
  const { apiClient } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data } = useSuspenseQuery({
    queryKey: [scheduledBuildingUpgradesCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await apiClient.get(
        '/villages/:villageId/scheduled-building-upgrades',
        {
          path: { villageId: currentVillage.id },
        },
      );

      return data;
    },
  });

  const scheduledBuildingUpgrades: ScheduledBuildingUpgrade[] = data.map(
    (upgrade) => ({
      ...upgrade,
      type: 'scheduledBuildingUpgrade',
      previousLevel: upgrade.level - 1,
    }),
  );

  const { mutate: scheduleBuildingUpgrade } = useMutation<
    void,
    Error,
    {
      buildingId: Building['id'];
      buildingFieldId: BuildingField['id'];
      level: number;
    }
  >({
    mutationFn: async (body) => {
      await apiClient.post('/villages/:villageId/scheduled-building-upgrades', {
        path: { villageId: currentVillage.id },
        body,
      });
    },
    onSuccess: async (_data, _variables, _onMutateResult, context) => {
      await invalidateQueries(context, [
        [scheduledBuildingUpgradesCacheKey, currentVillage.id],
        [eventsCacheKey, 'buildingLevelChange', currentVillage.id],
        [currentVillageCacheKey, currentVillage.slug],
      ]);
    },
  });

  const { mutate: cancelScheduledBuildingUpgrade } = useMutation<
    void,
    Error,
    { scheduledUpgradeId: number }
  >({
    mutationFn: async ({ scheduledUpgradeId }) => {
      await apiClient.delete(
        '/villages/:villageId/scheduled-building-upgrades/:scheduledUpgradeId',
        {
          path: {
            villageId: currentVillage.id,
            scheduledUpgradeId,
          },
        },
      );
    },
    onSuccess: async (_data, _variables, _onMutateResult, context) => {
      await invalidateQueries(context, [
        [scheduledBuildingUpgradesCacheKey, currentVillage.id],
        [eventsCacheKey, 'buildingLevelChange', currentVillage.id],
        [currentVillageCacheKey, currentVillage.slug],
      ]);
    },
  });

  const { mutate: reorderScheduledBuildingUpgrades } = useMutation<
    void,
    Error,
    { scheduledUpgradeIds: number[] }
  >({
    mutationFn: async (body) => {
      await apiClient.patch(
        '/villages/:villageId/scheduled-building-upgrades',
        {
          path: { villageId: currentVillage.id },
          body,
        },
      );
    },
    onSuccess: async (_data, _variables, _onMutateResult, context) => {
      await invalidateQueries(context, [
        [scheduledBuildingUpgradesCacheKey, currentVillage.id],
      ]);
    },
  });

  return {
    scheduledBuildingUpgrades,
    scheduleBuildingUpgrade,
    cancelScheduledBuildingUpgrade,
    reorderScheduledBuildingUpgrades,
  };
};
