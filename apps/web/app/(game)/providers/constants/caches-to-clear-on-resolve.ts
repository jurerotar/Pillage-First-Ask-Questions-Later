import type {
  GameEvent,
  GameEventType,
} from '@pillage-first/types/models/game-event';
import {
  adventurePointsCacheKey,
  collectableQuestCountCacheKey,
  effectsCacheKey,
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
  __internal__seedOasisOccupiableByTable: () => [],
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
    ];
  },
  buildingDestruction: () => {
    return [playerVillagesCacheKey, effectsCacheKey];
  },

  troopTraining: () => {
    return [playerTroopsCacheKey, effectsCacheKey];
  },
  troopMovement: (event) => {
    const { movementType } = event;

    switch (movementType) {
      case 'adventure': {
        return [heroCacheKey, adventurePointsCacheKey, heroInventoryCacheKey];
      }
      case 'find-new-village': {
        return [villageListing];
      }
      case 'return': {
        return [playerVillagesCacheKey, playerTroopsCacheKey];
      }
      default: {
        console.error(
          `No cache-keys-to-invalidate set for movementType ${movementType}`,
        );

        return [];
      }
    }
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
};
