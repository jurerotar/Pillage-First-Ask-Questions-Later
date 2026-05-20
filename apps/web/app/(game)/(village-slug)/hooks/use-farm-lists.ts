import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { farmListsCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { invalidateQueries } from 'app/utils/react-query';
import { useCurrentVillage } from './current-village/use-current-village';
import { useMe } from './use-me';

export const useFarmLists = () => {
  const { apiClient } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();
  const { player } = useMe();

  const { data: farmLists } = useSuspenseQuery({
    queryKey: [farmListsCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get('/players/:playerId/farm-lists', {
        path: {
          playerId: player.id,
        },
      });

      return data;
    },
  });

  const { mutate: createFarmList } = useMutation({
    mutationFn: async (name: string) => {
      await apiClient.post('/villages/:villageId/farm-lists', {
        path: {
          villageId: currentVillage.id,
        },
        body: { name },
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [[farmListsCacheKey]]);
    },
  });

  const { mutate: deleteFarmList } = useMutation({
    mutationFn: async (farmListId: number) => {
      await apiClient.delete('/farm-lists/:farmListId', {
        path: {
          farmListId,
        },
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
      await apiClient.patch('/farm-lists/:farmListId', {
        path: {
          farmListId: id,
        },
        body: { name, villageId },
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [[farmListsCacheKey]]);
    },
  });

  const { mutate: renameFarmList } = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      await apiClient.patch('/farm-lists/:farmListId', {
        path: {
          farmListId: id,
        },
        body: { name },
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [[farmListsCacheKey]]);
    },
  });

  const getFarmList = async (farmListId: number) => {
    const { data } = await apiClient.get('/farm-lists/:farmListId', {
      path: {
        farmListId,
      },
    });
    return data;
  };

  const { mutate: addTileToFarmList } = useMutation({
    mutationFn: async ({
      farmListId,
      tileId,
    }: {
      farmListId: number;
      tileId: number;
    }) => {
      await apiClient.post('/farm-lists/:farmListId/tiles', {
        path: {
          farmListId,
        },
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
      await apiClient.delete('/farm-lists/:farmListId/tiles/:tileId', {
        path: {
          farmListId,
          tileId,
        },
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
