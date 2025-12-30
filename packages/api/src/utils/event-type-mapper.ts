import type { GameEventType } from '@pillage-first/types/models/game-event';
import { adventurePointIncreaseResolver } from '../handlers/resolvers/adventure-resolvers';
import {
  buildingConstructionResolver,
  buildingDestructionResolver,
  buildingLevelChangeResolver,
  buildingScheduledConstructionEventResolver,
} from '../handlers/resolvers/building-resolvers';
import { internalSeedOasisOccupiableByTableResolver } from '../handlers/resolvers/internal-resolvers';
import { troopTrainingEventResolver } from '../handlers/resolvers/troop-resolvers';
import { unitImprovementResolver } from '../handlers/resolvers/unit-improvement-resolvers';
import { unitResearchResolver } from '../handlers/resolvers/unit-research-resolvers';
// import { troopMovementResolver } from 'app/(game)/api/handlers/resolvers/troop-movement-resolvers';

export const getGameEventResolver = (gameEventType: GameEventType) => {
  switch (gameEventType) {
    case 'buildingLevelChange': {
      return buildingLevelChangeResolver;
    }
    case 'buildingConstruction': {
      return buildingConstructionResolver;
    }
    case 'buildingDestruction': {
      return buildingDestructionResolver;
    }
    case 'buildingScheduledConstruction': {
      return buildingScheduledConstructionEventResolver;
    }
    case 'troopTraining': {
      return troopTrainingEventResolver;
    }
    case 'adventurePointIncrease': {
      return adventurePointIncreaseResolver;
    }
    case 'unitResearch': {
      return unitResearchResolver;
    }
    case 'unitImprovement': {
      return unitImprovementResolver;
    }
    case '__internal__seedOasisOccupiableByTable': {
      return internalSeedOasisOccupiableByTableResolver;
    }
    // case 'troopMovement': {
    //   return troopMovementResolver;
    // }
    default: {
      console.error('No resolver function set for event type', gameEventType);

      return () => {};
    }
  }
};
