import type { GameEvent } from 'app/interfaces/models/game/game-event';
import type { Resolver } from 'app/interfaces/models/common';
import { generateTroopMovementReport } from 'app/(game)/(village-slug)/hooks/resolvers/utils/reports';
import { reportsCacheKey, troopsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { QueryClient } from '@tanstack/react-query';
import type { Troop } from 'app/interfaces/models/game/troop';

const setReport = (queryClient: QueryClient, report: Report): void => {
  queryClient.setQueryData<Report[]>([reportsCacheKey], (reports) => {
    return [report, ...reports!];
  });
};

const reinforcement: Resolver<GameEvent<'troopMovement'>> = async (queryClient, args) => {
  const { villageId: originatingVillageId, targetVillageId, troops } = args;

  const reinforcementReport = generateTroopMovementReport({
    originatingVillageId,
    targetVillageId,
    movementType: 'reinforcements',
    troops,
  });

  setReport(queryClient, reinforcementReport);

  queryClient.setQueryData<Troop[]>([troopsCacheKey], (troops) => {
  });
};

const relocation: Resolver<GameEvent<'troopMovement'>> = async (queryClient, args) => {
};

const raid: Resolver<GameEvent<'troopMovement'>> = async (queryClient, args) => {
};

const attack: Resolver<GameEvent<'troopMovement'>> = async (queryClient, args) => {
};

export const troopMovementResolver: Resolver<GameEvent<'troopMovement'>> = async (queryClient, args) => {
  const { movementType } = args;

  switch (movementType) {
    case 'attack': {
      await attack(queryClient, args);
      break;
    }
    case 'raid': {
      await raid(queryClient, args);
      break;
    }
    case 'reinforcement': {
      await reinforcement(queryClient, args);
      break;
    }
    case 'relocation': {
      await relocation(queryClient, args);
      break;
    }
  }
};
