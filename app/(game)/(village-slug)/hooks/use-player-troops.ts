import { useSuspenseQuery } from '@tanstack/react-query';
import {
  playerTroopsCacheKey,
  playerVillagesCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import type { Troop } from 'app/interfaces/models/game/troop';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { useCreateEvent } from 'app/(game)/(village-slug)/hooks/use-create-event';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import type { Village } from 'app/interfaces/models/game/village';
import { use } from 'react';
import { ApiContext } from 'app/(game)/providers/api-provider';

type SendTroopsArgs = Pick<
  GameEvent<'troopMovement'>,
  'troops' | 'targetId' | 'movementType'
>;

export const usePlayerTroops = () => {
  const { fetcher } = use(ApiContext);
  const { createEvent: createTroopMovementEvent } =
    useCreateEvent('troopMovement');
  const { currentVillage } = useCurrentVillage();

  const { data: playerTroops } = useSuspenseQuery<Troop[]>({
    queryKey: [playerTroopsCacheKey, currentVillage.tileId],
    queryFn: async () => {
      const { data } = await fetcher<Troop[]>(
        `/villages/${currentVillage.id}/troops`,
      );
      return data;
    },
  });

  const getDeployableTroops = (villageId: Village['id']) => {
    return playerTroops.filter(
      ({ tileId, source }) => tileId === villageId && source === villageId,
    );
  };

  const sendTroops = ({ targetId, movementType, troops }: SendTroopsArgs) => {
    createTroopMovementEvent({
      movementType,
      targetId,
      troops,
      cachesToClearOnResolve: [playerVillagesCacheKey, playerTroopsCacheKey],
      cachesToClearImmediately: [playerTroopsCacheKey],
    });
  };

  return {
    playerTroops,
    sendTroops,
    getDeployableTroops,
  };
};
