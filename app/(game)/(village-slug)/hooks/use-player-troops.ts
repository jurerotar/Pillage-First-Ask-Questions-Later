import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { playerTroopsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useCreateEvent } from 'app/(game)/(village-slug)/hooks/use-create-event';
import {
  canSendTroops,
  modifyTroops,
} from 'app/(game)/api/handlers/resolvers/utils/troops';
import { ApiContext } from 'app/(game)/providers/api-provider';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import type { Troop } from 'app/interfaces/models/game/troop';
import type { Village } from 'app/interfaces/models/game/village';

type SendTroopsArgs = Pick<
  GameEvent<'troopMovement'>,
  'troops' | 'targetId' | 'movementType'
>;

export const usePlayerTroops = () => {
  const { fetcher } = use(ApiContext);
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { createEvent: createTroopMovementEvent } =
    useCreateEvent('troopMovement');
  const { currentVillage } = useCurrentVillage();

  const { data: playerTroops } = useSuspenseQuery<Troop[]>({
    queryKey: [playerTroopsCacheKey, currentVillage.tileId],
    queryFn: async () => {
      const { data } = await fetcher<Troop[]>(
        `/villages/${currentVillage.tileId}/troops`,
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
    const deployableTroops = getDeployableTroops(currentVillage.id);

    if (!canSendTroops(deployableTroops, troops)) {
      toast(t('Unable to send that many troops.'));
      return;
    }

    queryClient.setQueryData<Troop[]>(
      [playerTroopsCacheKey],
      (playerTroops) => {
        return modifyTroops(playerTroops!, troops, 'subtract');
      },
    );

    createTroopMovementEvent({
      movementType,
      targetId,
      troops,
      cachesToClearImmediately: [playerTroopsCacheKey],
    });
  };

  return {
    playerTroops,
    sendTroops,
    getDeployableTroops,
  };
};
