import { useQuery, useQueryClient } from '@tanstack/react-query';
import { playerTroopsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { Troop } from 'app/interfaces/models/game/troop';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { useCreateEvent } from 'app/(game)/(village-slug)/hooks/use-create-event';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { canSendTroops, modifyTroops } from 'app/(game)/(village-slug)/hooks/resolvers/utils/troops';
import type { Village } from 'app/interfaces/models/game/village';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { calculateTravelDuration } from 'app/(game)/(village-slug)/utils/troop-movements';
import { useEffects } from 'app/(game)/(village-slug)/hooks/use-effects';

type SendTroopsArgs = Pick<GameEvent<'troopMovement'>, 'troops' | 'targetId' | 'movementType'>;

export const usePlayerTroops = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { createEvent: createTroopMovementEvent } = useCreateEvent('troopMovement');
  const { currentVillage } = useCurrentVillage();
  const { effects } = useEffects();

  const { data: playerTroops } = useQuery<Troop[]>({
    queryKey: [playerTroopsCacheKey],
    initialData: [],
  });

  const getSendableTroops = (villageId: Village['id']) => {
    return playerTroops.filter(({ tileId, source }) => tileId === villageId && source === villageId);
  };

  const sendTroops = ({ targetId, movementType, troops }: SendTroopsArgs) => {
    const sendableTroops = getSendableTroops(currentVillage.id);

    if (!canSendTroops(sendableTroops, troops)) {
      toast(t('Unable to send that many troops.'));
      return;
    }

    queryClient.setQueryData<Troop[]>([playerTroopsCacheKey], (playerTroops) => {
      return modifyTroops(playerTroops!, troops, 'subtract');
    });

    const duration = calculateTravelDuration({
      villageId: currentVillage.id,
      targetId,
      troops,
      effects,
    });

    createTroopMovementEvent({
      villageId: currentVillage.id,
      movementType,
      targetId,
      troops,
      startsAt: Date.now(),
      duration,
    });
  };

  return {
    playerTroops,
    sendTroops,
    getSendableTroops,
  };
};
