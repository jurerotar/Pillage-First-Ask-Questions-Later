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
  originCoordinates?: Village['coordinates'];
  type: TroopMovementEventType;
  troops: GameEvent<'troopMovementReinforcements'>['troops'];
  targetCoordinates: GameEvent<'troopMovementReinforcements'>['targetCoordinates'];
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
      const { data } = await apiClient.get('/villages/:villageId/troops', {
        path: {
          villageId: currentVillage.id,
        },
      });

      return data;
    },
  });

  const { data: sentReinforcements } = useSuspenseQuery({
    queryKey: [sentReinforcementsCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await apiClient.get(
        '/villages/:villageId/sent-reinforcements',
        {
          path: {
            villageId: currentVillage.id,
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
      targetCoordinates,
      type,
      troops,
      villageId,
      originCoordinates,
    }: SendTroopsArgs) => {
      await apiClient.post('/events', {
        body: {
          villageId: villageId ?? currentVillage.id,
          originCoordinates: originCoordinates ?? currentVillage.coordinates,
          type,
          targetCoordinates,
          troops,
        } as never,
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
      await apiClient.post('/villages/:villageId/relocate-reinforcements', {
        path: {
          villageId: currentVillage.id,
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
      await apiClient.post('/villages/:villageId/return-reinforcements', {
        path: {
          villageId: currentVillage.id,
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
      await apiClient.post('/villages/:villageId/return-sent-reinforcements', {
        path: {
          villageId: currentVillage.id,
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
      await apiClient.post(
        '/villages/:villageId/relocate-sent-reinforcements',
        {
          path: {
            villageId: currentVillage.id,
          },
          body: {
            stationedTileId,
            troops,
          },
        },
      );
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
