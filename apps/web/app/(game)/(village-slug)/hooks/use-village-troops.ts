import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use, useCallback } from 'react';
import { z } from 'zod';
import type {
  GameEvent,
  TroopMovementEventType,
} from '@pillage-first/types/models/game-event';
import { troopSchema } from '@pillage-first/types/models/troop';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import {
  troopMovementsCacheKey,
  villageTroopsCacheKey,
} from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { invalidateQueries } from 'app/utils/react-query';

type SendTroopsArgs = {
  type: TroopMovementEventType;
  troops: GameEvent<'troopMovementReinforcements'>['troops'];
  targetCoordinates: GameEvent<'troopMovementReinforcements'>['targetCoordinates'];
};

export const useVillageTroops = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { data: villageTroops } = useSuspenseQuery({
    queryKey: [villageTroopsCacheKey, currentVillage.id],
    queryFn: async () => {
      const { data } = await fetcher(`/villages/${currentVillage.id}/troops`);

      return z.array(troopSchema).parse(data);
    },
  });

  const getDeployableTroops = useCallback(() => {
    return villageTroops.filter(
      ({ tileId, source }) =>
        tileId === currentVillage.tileId && source === currentVillage.tileId,
    );
  }, [villageTroops, currentVillage]);

  const { mutate: sendTroops } = useMutation({
    mutationFn: async ({ targetCoordinates, type, troops }: SendTroopsArgs) => {
      await fetcher('/events', {
        method: 'POST',
        body: {
          villageId: currentVillage.id,
          originCoordinates: currentVillage.coordinates,
          type,
          targetCoordinates,
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

  return {
    villageTroops,
    sendTroops,
    getDeployableTroops,
  };
};
