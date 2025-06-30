import type { GameEventType } from 'app/interfaces/models/game/game-event';
import {
  buildingConstructionResolver,
  buildingDestructionResolver,
  buildingLevelChangeResolver,
  buildingScheduledConstructionEventResolver,
} from 'app/(game)/api/handlers/resolvers/building-resolvers';
import { troopTrainingEventResolver } from 'app/(game)/api/handlers/resolvers/troop-resolvers';
import { adventurePointIncreaseResolver } from 'app/(game)/api/handlers/resolvers/adventure-resolvers';
import { unitResearchResolver } from 'app/(game)/api/handlers/resolvers/unit-research-resolvers';
import { unitImprovementResolver } from 'app/(game)/api/handlers/resolvers/unit-improvement-resolvers';
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
    // case 'troopMovement': {
    //   return troopMovementResolver;
    // }
    default: {
      return console.error(
        'No resolver function set for event type',
        gameEventType,
      );
    }
  }
};
