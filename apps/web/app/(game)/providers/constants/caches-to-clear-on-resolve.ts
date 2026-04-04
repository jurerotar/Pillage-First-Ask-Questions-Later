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
  unitImprovementCacheKey,
  unitResearchCacheKey,
  villageListingCacheKey,
  villageTroopsCacheKey,
} from 'app/(game)/constants/query-keys';

type HandlerFor<K extends GameEventType> = (event: GameEvent<K>) => string[];

type Handlers = {
  [K in GameEventType]: HandlerFor<K>;
};

export const cachesToClearOnResolve: Handlers = {
  buildingScheduledConstruction: () => [],
  buildingConstruction: () => {
    return [
      currentVillageCacheKey,
      effectsCacheKey,
      questsCacheKey,
      collectableQuestCountCacheKey,
    ];
  },
  buildingLevelChange: () => {
    return [
      currentVillageCacheKey,
      effectsCacheKey,
      questsCacheKey,
      collectableQuestCountCacheKey,
      eventsHistoryCacheKey,
    ];
  },
  buildingDestruction: () => {
    return [currentVillageCacheKey, effectsCacheKey, eventsHistoryCacheKey];
  },
  troopTraining: () => {
    return [villageTroopsCacheKey, effectsCacheKey, eventsHistoryCacheKey];
  },
  troopMovementReinforcements: () => {
    return [villageTroopsCacheKey, effectsCacheKey, currentVillageCacheKey];
  },
  troopMovementRelocation: () => {
    return [villageTroopsCacheKey, effectsCacheKey, currentVillageCacheKey];
  },
  troopMovementReturn: () => {
    return [currentVillageCacheKey, villageTroopsCacheKey];
  },
  troopMovementFindNewVillage: () => {
    return [
      villageListingCacheKey,
      effectsCacheKey,
      currentVillageCacheKey,
      tilesCacheKey,
    ];
  },
  troopMovementAttack: () => {
    return [villageListingCacheKey, effectsCacheKey, currentVillageCacheKey];
  },
  troopMovementRaid: () => {
    return [villageListingCacheKey, effectsCacheKey, currentVillageCacheKey];
  },
  troopMovementOasisOccupation: () => {
    return [
      heroCacheKey,
      villageListingCacheKey,
      effectsCacheKey,
      currentVillageCacheKey,
      tilesCacheKey,
    ];
  },
  troopMovementAdventure: () => {
    return [
      heroCacheKey,
      adventurePointsCacheKey,
      heroInventoryCacheKey,
      questsCacheKey,
      effectsCacheKey,
    ];
  },
  unitResearch: () => {
    return [unitResearchCacheKey, eventsHistoryCacheKey];
  },
  unitImprovement: () => {
    return [unitImprovementCacheKey, eventsHistoryCacheKey];
  },
  adventurePointIncrease: () => {
    return [adventurePointsCacheKey];
  },
  heroRevival: () => {
    return [
      heroCacheKey,
      effectsCacheKey,
      eventsCacheKey,
      villageTroopsCacheKey,
    ];
  },
  heroHealthRegeneration: () => {
    return [heroCacheKey];
  },
  loyaltyIncrease: () => {
    return [loyaltyCacheKey];
  },
};
