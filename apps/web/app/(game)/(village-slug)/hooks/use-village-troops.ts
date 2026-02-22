import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { use } from 'react';
import { z } from 'zod';
import type {
  GameEvent,
  GameEventType,
  TroopMovementType,
} from '@pillage-first/types/models/game-event';
import { troopSchema } from '@pillage-first/types/models/troop';
import type { Village } from '@pillage-first/types/models/village';
import { playerTroopsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { ApiContext } from 'app/(game)/providers/api-provider';

type SendTroopsArgs = {
  troops: GameEvent<'troopMovementReinforcements'>['troops'];
  targetId: GameEvent<'troopMovementReinforcements'>['targetId'];
  movementType: TroopMovementType;
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
    mutationFn: async ({ targetId, movementType, troops }: SendTroopsArgs) => {
      const eventType =
        `troopMovement${movementType.charAt(0).toUpperCase()}${movementType
          .slice(1)
          .replace(/-([a-z])/g, (g) => g[1].toUpperCase())}` as GameEventType;

      await fetcher('/events', {
        method: 'POST',
        body: {
          villageId: currentVillage.id,
          type: eventType,
          targetId,
          troops,
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [playerTroopsCacheKey],
      });
    },
  });

  return {
    villageTroops,
    sendTroops,
    getDeployableTroops,
  };
};
