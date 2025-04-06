import type { GameEvent } from 'app/interfaces/models/game/game-event';
import type { Resolver } from 'app/interfaces/models/common';
import { generateTroopMovementReport } from 'app/(game)/(village-slug)/hooks/resolvers/utils/reports';
import { addTroops, setReport } from 'app/(game)/(village-slug)/hooks/resolvers/utils/troops';
import { effectsCacheKey, troopsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { Troop } from 'app/interfaces/models/game/troop';
import { createEventFn } from 'app/(game)/(village-slug)/hooks/utils/events';
import { calculateTravelDuration } from 'app/(game)/(village-slug)/utils/troop-movements';
import type { Effect } from 'app/interfaces/models/game/effect';

export const troopMovementResolver: Resolver<GameEvent<'troopMovement'>> = async (queryClient, args) => {
  const { villageId, targetId, troops: incomingTroops, movementType } = args;

  queryClient.setQueryData<Troop[]>([troopsCacheKey], (troops) => {
    return addTroops(troops!, incomingTroops);
  });

  // We don't create reports on troop return
  if (movementType !== 'return') {
    return;
  }

  const relocationReport = generateTroopMovementReport({
    villageId,
    targetId,
    movementType,
    troops: incomingTroops,
  });

  setReport(queryClient, relocationReport);
};

export const offensiveTroopMovementResolver: Resolver<GameEvent<'offensiveTroopMovement'>> = async (queryClient, args) => {
  const { villageId, targetId, troops, startsAt, duration } = args;

  // TODO: Add combat calc

  const effects = queryClient.getQueryData<Effect[]>([effectsCacheKey])!;

  await createEventFn<'troopMovement'>(queryClient, {
    villageId: targetId,
    targetId: villageId,
    troops,
    movementType: 'return',
    type: 'troopMovement',
    startsAt: startsAt + duration,
    duration: calculateTravelDuration({
      villageId,
      targetId,
      troops,
      effects,
    }),
  });
};

export const oasisOccupationTroopMovementResolver: Resolver<GameEvent<'offensiveTroopMovement'>> = async (queryClient, args) => {
  const { villageId, targetId, troops, startsAt, duration } = args;

  // TODO: Add combat calc

  const effects = queryClient.getQueryData<Effect[]>([effectsCacheKey])!;

  await createEventFn<'troopMovement'>(queryClient, {
    villageId: targetId,
    targetId: villageId,
    troops,
    movementType: 'return',
    type: 'troopMovement',
    startsAt: startsAt + duration,
    duration: calculateTravelDuration({
      villageId,
      targetId,
      troops,
      effects,
    }),
  });
};
