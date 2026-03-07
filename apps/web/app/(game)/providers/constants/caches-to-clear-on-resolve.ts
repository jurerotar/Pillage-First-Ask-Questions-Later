import type {
  GameEvent,
  GameEventType,
} from '@pillage-first/types/models/game-event';
import {
  adventurePointsCacheKey,
  collectableQuestCountCacheKey,
  effectsCacheKey,
  eventsCacheKey,
  eventsHistoryCacheKey,
  heroCacheKey,
  heroInventoryCacheKey,
  playerTroopsCacheKey,
  playerVillagesCacheKey,
  questsCacheKey,
  unitImprovementCacheKey,
  unitResearchCacheKey,
  villageListing,
} from 'app/(game)/(village-slug)/constants/query-keys';

type HandlerFor<K extends GameEventType> = (event: GameEvent<K>) => string[];

type Handlers = {
  [K in GameEventType]: HandlerFor<K>;
};

export const cachesToClearOnResolve: Handlers = {
  buildingScheduledConstruction: () => [],
  buildingConstruction: () => {
    return [
      playerVillagesCacheKey,
      effectsCacheKey,
      questsCacheKey,
      collectableQuestCountCacheKey,
    ];
  },
  buildingLevelChange: () => {
    return [
      playerVillagesCacheKey,
      effectsCacheKey,
      questsCacheKey,
      collectableQuestCountCacheKey,
      eventsHistoryCacheKey,
    ];
  },
  buildingDestruction: () => {
    return [playerVillagesCacheKey, effectsCacheKey, eventsHistoryCacheKey];
  },
  troopTraining: () => {
    return [playerTroopsCacheKey, effectsCacheKey, eventsHistoryCacheKey];
  },
  troopMovementReinforcements: () => {
    return [playerTroopsCacheKey, effectsCacheKey, playerVillagesCacheKey];
  },
  troopMovementRelocation: () => {
    return [playerTroopsCacheKey, effectsCacheKey, playerVillagesCacheKey];
  },
  troopMovementReturn: () => {
    return [playerVillagesCacheKey, playerTroopsCacheKey];
  },
  troopMovementFindNewVillage: () => {
    return [villageListing, effectsCacheKey, playerVillagesCacheKey];
  },
  troopMovementAttack: () => {
    return [villageListing, effectsCacheKey, playerVillagesCacheKey];
  },
  troopMovementRaid: () => {
    return [villageListing, effectsCacheKey, playerVillagesCacheKey];
  },
  troopMovementOasisOccupation: () => {
    return [
      heroCacheKey,
      villageListing,
      effectsCacheKey,
      playerVillagesCacheKey,
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
    return [heroCacheKey, effectsCacheKey, eventsCacheKey];
  },
  heroHealthRegeneration: () => {
    return [heroCacheKey];
  },
};
