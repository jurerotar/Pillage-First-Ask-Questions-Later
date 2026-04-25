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
  scheduledBuildingUpgradesCacheKey,
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
  buildingScheduledConstruction: () => [],
  buildingConstruction: () => {
    return [[currentVillageCacheKey]];
  },
  buildingLevelChange: ({ villageId }) => {
    return [
      [currentVillageCacheKey],
      [effectsCacheKey, villageId],
      [questsCacheKey, villageId],
      [scheduledBuildingUpgradesCacheKey, villageId],
      [collectableQuestCountCacheKey, villageId],
      [eventsHistoryCacheKey, villageId],
    ];
  },
  buildingDestruction: ({ villageId }) => {
    return [
      [currentVillageCacheKey],
      [effectsCacheKey, villageId],
      [eventsHistoryCacheKey, villageId],
    ];
  },
  troopTraining: ({ villageId }) => {
    return [
      [villageTroopsCacheKey, villageId],
      [effectsCacheKey, villageId],
      [eventsHistoryCacheKey, villageId],
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
    return [[unitResearchCacheKey], [eventsHistoryCacheKey, villageId]];
  },
  unitImprovement: ({ villageId }) => {
    return [[unitImprovementCacheKey], [eventsHistoryCacheKey, villageId]];
  },
  adventurePointIncrease: () => {
    return [[adventurePointsCacheKey]];
  },
  heroRevival: ({ villageId }) => {
    return [
      [heroCacheKey],
      [effectsCacheKey, villageId],
      [eventsCacheKey, villageId],
      [villageTroopsCacheKey, villageId],
    ];
  },
  heroHealthRegeneration: () => {
    return [[heroCacheKey]];
  },
  loyaltyIncrease: ({ villageId }) => {
    return [[loyaltyCacheKey, villageId]];
  },
};
