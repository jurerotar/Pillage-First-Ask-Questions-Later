import type { GameEventType } from '@pillage-first/types/models/game-event';
import type { EventResolver } from './resolver';
import { animalCageProductionResolver } from './resolvers/animal-cage-production-resolver';
import { buildingConstructionResolver } from './resolvers/building-construction-resolver';
import { buildingDestructionResolver } from './resolvers/building-destruction-resolver';
import { buildingLevelChangeResolver } from './resolvers/building-level-change-resolver';
import { culturePointsCelebrationResolver } from './resolvers/culture-points-celebration-resolver';
import { gatherersHutGatheringTripResolver } from './resolvers/gatherers-hut-gathering-trip-resolver';
import { heroRevivalResolver } from './resolvers/hero-revival-resolver';
import { huntersLodgeHuntResolver } from './resolvers/hunters-lodge-hunt-resolver';
import { resourceTransferResolver } from './resolvers/resource-transfer-resolver';
import { tradeRouteResolver } from './resolvers/trade-route-resolver';
import { trapperCageProductionResolver } from './resolvers/trapper-cage-production-resolver';
import { adventureMovementResolver } from './resolvers/troop-movement-adventure-resolver';
import { attackMovementResolver } from './resolvers/troop-movement-attack-resolver';
import { findNewVillageMovementResolver } from './resolvers/troop-movement-find-new-village-resolver';
import { oasisOccupationMovementResolver } from './resolvers/troop-movement-oasis-occupation-resolver';
import { raidMovementResolver } from './resolvers/troop-movement-raid-resolver';
import { reinforcementMovementResolver } from './resolvers/troop-movement-reinforcements-resolver';
import { relocationMovementResolver } from './resolvers/troop-movement-relocation-resolver';
import { returnMovementResolver } from './resolvers/troop-movement-return-resolver';
import { troopTrainingEventResolver } from './resolvers/troop-training-resolver';
import { unitImprovementResolver } from './resolvers/unit-improvement-resolver';
import { unitResearchResolver } from './resolvers/unit-research-resolver';

type GameEventResolverMap = {
  [T in GameEventType]: EventResolver<T>;
};

const gameEventResolvers: GameEventResolverMap = {
  buildingLevelChange: buildingLevelChangeResolver,
  buildingConstruction: buildingConstructionResolver,
  buildingDestruction: buildingDestructionResolver,
  troopTraining: troopTrainingEventResolver,
  troopMovementReinforcements: reinforcementMovementResolver,
  troopMovementRelocation: relocationMovementResolver,
  troopMovementReturn: returnMovementResolver,
  troopMovementFindNewVillage: findNewVillageMovementResolver,
  troopMovementAttack: attackMovementResolver,
  troopMovementRaid: raidMovementResolver,
  troopMovementOasisOccupation: oasisOccupationMovementResolver,
  troopMovementAdventure: adventureMovementResolver,
  heroRevival: heroRevivalResolver,
  culturePointsCelebration: culturePointsCelebrationResolver,
  unitResearch: unitResearchResolver,
  unitImprovement: unitImprovementResolver,
  animalCageProduction: animalCageProductionResolver,
  trapperCageProduction: trapperCageProductionResolver,
  huntersLodgeHunt: huntersLodgeHuntResolver,
  gatherersHutGatheringTrip: gatherersHutGatheringTripResolver,
  resourceTransfer: resourceTransferResolver,
  tradeRoute: tradeRouteResolver,
};

export const getEventResolver = <T extends GameEventType>(
  type: T,
): EventResolver<T> => gameEventResolvers[type];
