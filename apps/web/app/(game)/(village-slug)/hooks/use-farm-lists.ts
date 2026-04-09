import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { z } from 'zod';
import { farmListsCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { invalidateQueries } from 'app/utils/react-query';
import { useCurrentVillage } from './current-village/use-current-village';

const farmListSchema = z.strictObject({
  id: z.number(),
  name: z.string(),
  villageId: z.number(),
  targetCount: z.number(),
});

const farmListWithTilesSchema = farmListSchema.extend({
  tileIds: z.array(z.number()),
});

export const useFarmLists = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: farmLists } = useSuspenseQuery({
    queryKey: [farmListsCacheKey],
    queryFn: async () => {
      const { data } = await fetcher('/me/farm-lists');

      return z.array(farmListSchema).parse(data);
    },
  });

  const { mutate: createFarmList } = useMutation({
    mutationFn: async (name: string) => {
      await fetcher(`/villages/${currentVillage.id}/farm-lists`, {
        method: 'POST',
        body: { name },
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [[farmListsCacheKey]]);
    },
  });

  const { mutate: deleteFarmList } = useMutation({
    mutationFn: async (farmListId: number) => {
      await fetcher(`/farm-lists/${farmListId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [[farmListsCacheKey]]);
    },
  });

  const { mutate: updateFarmList } = useMutation({
    mutationFn: async ({
      id,
      name,
      villageId,
    }: {
      id: number;
      name?: string;
      villageId?: number;
    }) => {
      await fetcher(`/farm-lists/${id}`, {
        method: 'PATCH',
        body: { name, villageId },
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [[farmListsCacheKey]]);
    },
  });

  const { mutate: renameFarmList } = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      await fetcher(`/farm-lists/${id}/rename`, {
        method: 'PATCH',
        body: { name },
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [[farmListsCacheKey]]);
    },
  });

  const getFarmList = async (farmListId: number) => {
    const { data } = await fetcher(`/farm-lists/${farmListId}`);
    return farmListWithTilesSchema.parse(data);
  };

  const { mutate: addTileToFarmList } = useMutation({
    mutationFn: async ({
      farmListId,
      tileId,
    }: {
      farmListId: number;
      tileId: number;
    }) => {
      await fetcher(`/farm-lists/${farmListId}/tiles`, {
        method: 'POST',
        body: { tileId },
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [
        [farmListsCacheKey, currentVillage.id],
      ]);
    },
  });

  const { mutate: removeTileFromFarmList } = useMutation({
    mutationFn: async ({
      farmListId,
      tileId,
    }: {
      farmListId: number;
      tileId: number;
    }) => {
      await fetcher(`/farm-lists/${farmListId}/tiles/${tileId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [
        [farmListsCacheKey, currentVillage.id],
      ]);
    },
  });

  return {
    farmLists,
    createFarmList,
    deleteFarmList,
    updateFarmList,
    renameFarmList,
    getFarmList,
    addTileToFarmList,
    removeTileFromFarmList,
  };
};
