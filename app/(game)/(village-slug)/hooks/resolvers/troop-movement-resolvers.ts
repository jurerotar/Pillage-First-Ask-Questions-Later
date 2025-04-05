import type { GameEvent } from 'app/interfaces/models/game/game-event';
import type { Resolver } from 'app/interfaces/models/common';
import { generateTroopMovementReport } from 'app/(game)/(village-slug)/hooks/resolvers/utils/reports';
import { addTroops, setReport } from 'app/(game)/(village-slug)/hooks/resolvers/utils/troops';
import { troopsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { Troop } from 'app/interfaces/models/game/troop';

export const troopMovementResolver: Resolver<GameEvent<'troopMovement'>> = async (queryClient, args) => {
  const { villageId, targetVillageId, troops: incomingTroops, movementType } = args;

  queryClient.setQueryData<Troop[]>([troopsCacheKey], (troops) => {
    return addTroops(troops!, incomingTroops);
  });

  const relocationReport = generateTroopMovementReport({
    villageId,
    targetVillageId,
    movementType,
    troops: incomingTroops,
  });

  setReport(queryClient, relocationReport);
};

export const offensiveTroopMovementResolver: Resolver<GameEvent<'offensiveTroopMovement'>> = async (_queryClient, _args) => {};
