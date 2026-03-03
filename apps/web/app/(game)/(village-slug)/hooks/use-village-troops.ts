import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { use } from 'react';
import { z } from 'zod';
import type {
  GameEvent,
  TroopMovementEventType,
} from '@pillage-first/types/models/game-event';
import { troopSchema } from '@pillage-first/types/models/troop';
import type { Village } from '@pillage-first/types/models/village';
import {
  eventsCacheKey,
  playerTroopsCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { ApiContext } from 'app/(game)/providers/api-provider';

type SendTroopsArgs = {
  type: TroopMovementEventType;
  troops: GameEvent<'troopMovementReinforcements'>['troops'];
  targetId: GameEvent<'troopMovementReinforcements'>['targetId'];
};

export const useVillageTroops = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();
  const queryClient = useQueryClient();

  const { data: villageTroops } = useSuspenseQuery({
    queryKey: [playerTroopsCacheKey, currentVillage.tileId],
    queryFn: async () => {
      const { data } = await fetcher(`/villages/${currentVillage.id}/troops`);

      return z.array(troopSchema).parse(data);
    },
  });

  const getDeployableTroops = (villageId: Village['id']) => {
    return villageTroops.filter(
      ({ tileId, source }) => tileId === villageId && source === villageId,
    );
  };

  const { mutate: sendTroops } = useMutation({
    mutationFn: async ({ targetId, type, troops }: SendTroopsArgs) => {
      await fetcher('/events', {
        method: 'POST',
        body: {
          villageId: currentVillage.id,
          type,
          targetId,
          troops,
        },
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [playerTroopsCacheKey, currentVillage.tileId],
        }),
        queryClient.invalidateQueries({
          queryKey: [eventsCacheKey, 'troopMovement', currentVillage.id],
        }),
      ]);
    },
  });

  return {
    villageTroops,
    sendTroops,
    getDeployableTroops,
  };
};
