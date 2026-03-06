import type {
  GameEvent,
  GameEventType,
} from '@pillage-first/types/models/game-event';
import {
  adventurePointsCacheKey,
  buildingHistoryCacheKey,
  collectableQuestCountCacheKey,
  effectsCacheKey,
  eventsCacheKey,
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
      buildingHistoryCacheKey,
    ];
  },
  buildingLevelChange: () => {
    return [
      playerVillagesCacheKey,
      effectsCacheKey,
      questsCacheKey,
      collectableQuestCountCacheKey,
      buildingHistoryCacheKey,
    ];
  },
  buildingDestruction: () => {
    return [playerVillagesCacheKey, effectsCacheKey, buildingHistoryCacheKey];
  },
  troopTraining: () => {
    return [playerTroopsCacheKey, effectsCacheKey];
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
    return [unitResearchCacheKey];
  },
  unitImprovement: () => {
    return [unitImprovementCacheKey];
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
