import { useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { z } from 'zod';
import { playerTroopsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useCreateEvent } from 'app/(game)/(village-slug)/hooks/use-create-event';
import { ApiContext } from 'app/(game)/providers/api-provider';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { troopSchema } from 'app/interfaces/models/game/troop';
import type { Village } from 'app/interfaces/models/game/village';

type SendTroopsArgs = Pick<
  GameEvent<'troopMovement'>,
  'troops' | 'targetId' | 'movementType'
>;

export const useVillageTroops = () => {
  const { fetcher } = use(ApiContext);
  const { createEvent: createTroopMovementEvent } =
    useCreateEvent('troopMovement');
  const { currentVillage } = useCurrentVillage();

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

  const sendTroops = ({ targetId, movementType, troops }: SendTroopsArgs) => {
    createTroopMovementEvent({
      movementType,
      targetId,
      troops,
      cachesToClearImmediately: [playerTroopsCacheKey],
    });
  };

  return {
    villageTroops,
    sendTroops,
    getDeployableTroops,
  };
};
