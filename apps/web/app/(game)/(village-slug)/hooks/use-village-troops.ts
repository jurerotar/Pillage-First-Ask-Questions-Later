import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use, useCallback } from 'react';
import type {
  GameEvent,
  TroopMovementEventType,
} from '@pillage-first/types/models/game-event';
import type { Unit } from '@pillage-first/types/models/unit';
import type { Village } from '@pillage-first/types/models/village';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import {
  effectsCacheKey,
  sentReinforcementsCacheKey,
  troopMovementsCacheKey,
  villageTroopsCacheKey,
} from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { invalidateQueries } from 'app/utils/react-query';

type SendTroopsArgs = {
  villageId?: Village['id'];
  originTileId?: Village['tileId'];
  type: TroopMovementEventType;
  troops: GameEvent<'troopMovementReinforcements'>['troops'];
  targetTileId: Village['tileId'];
};

type RelocateReinforcementsArgs = {
  sourceTileId: number;
  troops: {
    unitId: Unit['id'];
    amount: number;
  }[];
};

type ReturnSentReinforcementsArgs = {
  stationedTileId: number;
  troops: {
    unitId: Unit['id'];
    amount: number;
  }[];
};

type RelocateSentReinforcementsArgs = ReturnSentReinforcementsArgs;

export const useVillageTroops = () => {
  const { apiClient } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: villageTroops } = useSuspenseQuery({
    queryKey: [villageTroopsCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await apiClient.get('/tiles/:tileId/stationed-troops', {
        path: {
          tileId: currentVillage.tileId,
        },
      });

      return data;
    },
  });

  const { data: sentReinforcements } = useSuspenseQuery({
    queryKey: [sentReinforcementsCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await apiClient.get(
        '/tiles/:tileId/sent-reinforcements',
        {
          path: {
            tileId: currentVillage.tileId,
          },
        },
      );

      return data;
    },
  });

  const getDeployableTroops = useCallback(() => {
    return villageTroops.filter(
      ({ tileId, source }) =>
        tileId === currentVillage.tileId && source === currentVillage.tileId,
    );
  }, [villageTroops, currentVillage]);

  const { mutate: sendTroops } = useMutation({
    mutationFn: async ({
      targetTileId,
      type,
      troops,
      villageId,
      originTileId,
    }: SendTroopsArgs) => {
      await apiClient.post('/events', {
        body: {
          villageId: villageId ?? currentVillage.id,
          originTileId: originTileId ?? currentVillage.tileId,
          type,
          targetTileId,
          troops,
        },
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [
        [villageTroopsCacheKey, currentVillage.id],
        [troopMovementsCacheKey, currentVillage.id],
      ]);
    },
  });

  const { mutate: relocateReinforcements } = useMutation({
    mutationFn: async ({
      sourceTileId,
      troops,
    }: RelocateReinforcementsArgs) => {
      await apiClient.post('/tiles/:tileId/relocate-reinforcements', {
        path: {
          tileId: currentVillage.tileId,
        },
        body: {
          sourceTileId,
          troops,
        },
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [
        [villageTroopsCacheKey, currentVillage.id],
      ]);
    },
  });

  const { mutate: returnReinforcements } = useMutation({
    mutationFn: async ({
      sourceTileId,
      troops,
    }: RelocateReinforcementsArgs) => {
      await apiClient.post('/tiles/:tileId/return-reinforcements', {
        path: {
          tileId: currentVillage.tileId,
        },
        body: {
          sourceTileId,
          troops,
        },
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [
        [villageTroopsCacheKey, currentVillage.id],
        [troopMovementsCacheKey, currentVillage.id],
        [effectsCacheKey, currentVillage.id],
      ]);
    },
  });

  const { mutate: returnSentReinforcements } = useMutation({
    mutationFn: async ({
      stationedTileId,
      troops,
    }: ReturnSentReinforcementsArgs) => {
      await apiClient.post('/tiles/:tileId/return-sent-reinforcements', {
        path: {
          tileId: currentVillage.tileId,
        },
        body: {
          stationedTileId,
          troops,
        },
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [
        [sentReinforcementsCacheKey, currentVillage.id],
        [troopMovementsCacheKey, currentVillage.id],
        [effectsCacheKey, currentVillage.id],
      ]);
    },
  });

  const { mutate: relocateSentReinforcements } = useMutation({
    mutationFn: async ({
      stationedTileId,
      troops,
    }: RelocateSentReinforcementsArgs) => {
      await apiClient.post('/tiles/:tileId/relocate-sent-reinforcements', {
        path: {
          tileId: currentVillage.tileId,
        },
        body: {
          stationedTileId,
          troops,
        },
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [
        [sentReinforcementsCacheKey, currentVillage.id],
      ]);
    },
  });

  return {
    villageTroops,
    sentReinforcements,
    sendTroops,
    relocateReinforcements,
    returnReinforcements,
    relocateSentReinforcements,
    returnSentReinforcements,
    getDeployableTroops,
  };
};
