import type { GameEvent } from 'app/interfaces/models/game/game-event';
import type { Resolver } from 'app/interfaces/models/common';
import { generateTroopMovementReport } from 'app/(game)/(village-slug)/hooks/resolvers/utils/reports';
import { setReport } from 'app/(game)/(village-slug)/hooks/resolvers/utils/troops';

const reinforcement: Resolver<GameEvent<'troopMovement'>> = async (queryClient, args) => {
  const { villageId: originatingVillageId, targetVillageId, troops } = args;

  const reinforcementReport = generateTroopMovementReport({
    originatingVillageId,
    targetVillageId,
    movementType: 'reinforcement',
    troops,
  });

  setReport(queryClient, reinforcementReport);
};

const relocation: Resolver<GameEvent<'troopMovement'>> = async (queryClient, args) => {
  const { villageId: originatingVillageId, targetVillageId, troops } = args;

  const relocationReport = generateTroopMovementReport({
    originatingVillageId,
    targetVillageId,
    movementType: 'relocation',
    troops,
  });

  setReport(queryClient, relocationReport);
};

const returnReinforcements: Resolver<GameEvent<'troopMovement'>> = async (queryClient, args) => {
  const { villageId: originatingVillageId, targetVillageId, troops } = args;
};

const raid: Resolver<GameEvent<'troopMovement'>> = async (_queryClient, _args) => {
};

const attack: Resolver<GameEvent<'troopMovement'>> = async (_queryClient, _args) => {
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
    case 'return': {
      await returnReinforcements(queryClient, args);
      break;
    }
  }
};
