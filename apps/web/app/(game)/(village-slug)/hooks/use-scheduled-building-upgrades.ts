import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { z } from 'zod';
import { buildingIdSchema } from '@pillage-first/types/models/building';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import {
  currentVillageCacheKey,
  scheduledBuildingUpgradesCacheKey,
} from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { invalidateQueries } from 'app/utils/react-query';

export const scheduledUpgradeSchema = z.strictObject({
  id: z.number(),
  buildingId: buildingIdSchema,
  villageId: z.number(),
  buildingFieldId: z.number(),
  level: z.number(),
});

export const scheduleBuildingUpgradeSchema = z.strictObject({
  buildingId: buildingIdSchema,
  buildingFieldId: z.number(),
  level: z.number(),
});

export type ScheduledBuildingUpgrade = z.infer<typeof scheduledUpgradeSchema>;

export const useScheduledBuildingUpgrades = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: scheduledBuildingUpgrades } = useSuspenseQuery({
    queryKey: [scheduledBuildingUpgradesCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await fetcher(
        `/villages/${currentVillage.id}/scheduled-upgrades`,
      );

      return z.array(scheduledUpgradeSchema).parse(data);
    },
  });

  const { mutate: scheduleBuildingUpgrade } = useMutation<
    void,
    Error,
    z.infer<typeof scheduleBuildingUpgradeSchema>
  >({
    mutationFn: async (body) => {
      await fetcher(`/villages/${currentVillage.id}/scheduled-upgrades`, {
        method: 'POST',
        body,
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [
        [scheduledBuildingUpgradesCacheKey, currentVillage.id],
        [currentVillageCacheKey, currentVillage.slug],
      ]);
    },
  });

  const { mutate: removeScheduledBuildingUpgrade } = useMutation<
    void,
    Error,
    { scheduledUpgradeId: number }
  >({
    mutationFn: async ({ scheduledUpgradeId }) => {
      await fetcher(
        `/villages/${currentVillage.id}/scheduled-upgrades/${scheduledUpgradeId}`,
        { method: 'DELETE' },
      );
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [
        [scheduledBuildingUpgradesCacheKey, currentVillage.id],
        [currentVillageCacheKey],
      ]);
    },
  });

  return {
    scheduledBuildingUpgrades,
    scheduleBuildingUpgrade,
    removeScheduledBuildingUpgrade,
  };
};
