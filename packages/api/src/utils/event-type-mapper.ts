import type { GameEventType } from '@pillage-first/types/models/game-event';
import { adventurePointIncreaseResolver } from '../controllers/resolvers/adventure-resolvers';
import {
  buildingConstructionResolver,
  buildingDestructionResolver,
  buildingLevelChangeResolver,
  buildingScheduledConstructionEventResolver,
} from '../controllers/resolvers/building-resolvers';
import { internalSeedOasisOccupiableByTableResolver } from '../controllers/resolvers/internal-resolvers';
import { troopTrainingEventResolver } from '../controllers/resolvers/troop-resolvers';
import { unitImprovementResolver } from '../controllers/resolvers/unit-improvement-resolvers';
import { unitResearchResolver } from '../controllers/resolvers/unit-research-resolvers';

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
    default: {
      console.error('No resolver function set for event type', gameEventType);

      return () => {};
    }
  }
};
