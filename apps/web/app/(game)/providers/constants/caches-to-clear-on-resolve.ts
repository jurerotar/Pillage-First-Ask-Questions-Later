import type {
  GameEvent,
  GameEventType,
} from '@pillage-first/types/models/game-event';
import {
  adventurePointsCacheKey,
  collectableQuestCountCacheKey,
  currentVillageCacheKey,
  effectsCacheKey,
  eventsCacheKey,
  eventsHistoryCacheKey,
  heroCacheKey,
  heroInventoryCacheKey,
  loyaltyCacheKey,
  questsCacheKey,
  tilesCacheKey,
  troopMovementsCacheKey,
  unitImprovementCacheKey,
  unitResearchCacheKey,
  villageListingCacheKey,
  villageTroopsCacheKey,
} from 'app/(game)/constants/query-keys';

type HandlerFor<K extends GameEventType> = (event: GameEvent<K>) => unknown[][];

type Handlers = {
  [K in GameEventType]: HandlerFor<K>;
};

export const cachesToClearOnResolve: Handlers = {
  buildingScheduledConstruction: ({ villageId }) => {
    return [
      [eventsCacheKey, 'buildingScheduledConstruction', villageId],
      [eventsCacheKey, 'buildingLevelChange', villageId],
    ];
  },
  buildingConstruction: () => {
    return [[currentVillageCacheKey]];
  },
  buildingLevelChange: ({ villageId }) => {
    return [
      [currentVillageCacheKey],
      [effectsCacheKey, villageId],
      [questsCacheKey, villageId],
      [collectableQuestCountCacheKey, villageId],
      [eventsHistoryCacheKey, villageId],
      [eventsCacheKey, 'buildingLevelChange', villageId],
    ];
  },
  buildingDestruction: ({ villageId }) => {
    return [
      [currentVillageCacheKey],
      [effectsCacheKey, villageId],
      [eventsHistoryCacheKey, villageId],
      [eventsCacheKey, 'buildingDestruction', villageId],
    ];
  },
  troopTraining: ({ villageId }) => {
    return [
      [villageTroopsCacheKey, villageId],
      [effectsCacheKey, villageId],
      [eventsHistoryCacheKey, villageId],
      [eventsCacheKey, 'troopTraining', villageId],
    ];
  },
  troopMovementReinforcements: ({ villageId }) => {
    return [
      [villageTroopsCacheKey, villageId],
      [effectsCacheKey, villageId],
      [currentVillageCacheKey],
      [troopMovementsCacheKey, villageId],
    ];
  },
  troopMovementRelocation: ({ villageId }) => {
    return [
      [villageTroopsCacheKey, villageId],
      [effectsCacheKey, villageId],
      [currentVillageCacheKey],
      [troopMovementsCacheKey, villageId],
    ];
  },
  troopMovementReturn: ({ villageId }) => {
    return [
      [currentVillageCacheKey],
      [villageTroopsCacheKey, villageId],
      [troopMovementsCacheKey, villageId],
      [heroCacheKey],
    ];
  },
  troopMovementFindNewVillage: ({ villageId }) => {
    return [
      [villageListingCacheKey],
      [effectsCacheKey, villageId],
      [currentVillageCacheKey],
      [tilesCacheKey],
      [troopMovementsCacheKey, villageId],
    ];
  },
  troopMovementAttack: ({ villageId }) => {
    return [
      [effectsCacheKey, villageId],
      [currentVillageCacheKey],
      [troopMovementsCacheKey, villageId],
    ];
  },
  troopMovementRaid: ({ villageId }) => {
    return [
      [effectsCacheKey, villageId],
      [currentVillageCacheKey],
      [troopMovementsCacheKey, villageId],
    ];
  },
  // TODO: Update query keys here
  troopMovementOasisOccupation: ({ villageId }) => {
    return [
      [heroCacheKey],
      [effectsCacheKey, villageId],
      [currentVillageCacheKey],
      [tilesCacheKey],
      [troopMovementsCacheKey, villageId],
    ];
  },
  troopMovementAdventure: ({ villageId }) => {
    return [
      [heroCacheKey],
      [adventurePointsCacheKey],
      [heroInventoryCacheKey],
      [questsCacheKey, villageId],
      [effectsCacheKey, villageId],
      [troopMovementsCacheKey, villageId],
    ];
  },
  unitResearch: ({ villageId }) => {
    return [
      [unitResearchCacheKey],
      [eventsHistoryCacheKey, villageId],
      [eventsCacheKey, 'unitResearch', villageId],
    ];
  },
  unitImprovement: ({ villageId }) => {
    return [
      [unitImprovementCacheKey],
      [eventsHistoryCacheKey, villageId],
      [eventsCacheKey, 'unitImprovement', villageId],
    ];
  },
  animalCageProduction: ({ villageId }) => {
    return [
      [heroInventoryCacheKey],
      [eventsCacheKey, 'animalCageProduction', villageId],
      [eventsHistoryCacheKey, villageId],
    ];
  },
  huntersLodgeHunt: ({ villageId }) => {
    return [
      [currentVillageCacheKey],
      [villageTroopsCacheKey, villageId],
      [eventsCacheKey, 'huntersLodgeHunt', villageId],
    ];
  },
  heroRevival: ({ villageId }) => {
    return [
      [heroCacheKey],
      [effectsCacheKey, villageId],
      [eventsCacheKey, 'heroRevival', villageId],
      [villageTroopsCacheKey, villageId],
    ];
  },
  heroHealthRegeneration: () => {
    return [[heroCacheKey]];
  },
  loyaltyIncrease: ({ villageId }) => {
    return [[loyaltyCacheKey, villageId]];
  },
  gatherersHutGatheringTrip: ({ villageId }) => {
    return [
      [currentVillageCacheKey],
      [villageTroopsCacheKey, villageId],
      [eventsCacheKey, 'gatherersHutGatheringTrip', villageId],
    ];
  },
};
