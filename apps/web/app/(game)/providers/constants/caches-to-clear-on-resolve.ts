import type { GameEvent } from '@pillage-first/types/models/game-event';
import {
  adventurePointsCacheKey,
  collectableQuestCountCacheKey,
  effectsCacheKey,
  playerTroopsCacheKey,
  playerVillagesCacheKey,
  questsCacheKey,
  unitImprovementCacheKey,
  unitResearchCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';

export const cachesToClearOnResolve = new Map<GameEvent['type'], string[]>([
  ['__internal__seedOasisOccupiableByTable', []],
  ['buildingDestruction', [playerVillagesCacheKey, effectsCacheKey]],
  [
    'buildingConstruction',
    [
      playerVillagesCacheKey,
      effectsCacheKey,
      questsCacheKey,
      collectableQuestCountCacheKey,
    ],
  ],
  [
    'buildingLevelChange',
    [
      playerVillagesCacheKey,
      effectsCacheKey,
      questsCacheKey,
      collectableQuestCountCacheKey,
    ],
  ],
  ['buildingScheduledConstruction', []],
  ['unitImprovement', [unitImprovementCacheKey]],
  ['unitResearch', [unitResearchCacheKey]],
  [
    'troopMovement',
    [playerVillagesCacheKey, playerTroopsCacheKey, effectsCacheKey],
  ],
  ['troopTraining', [playerTroopsCacheKey, effectsCacheKey]],
  ['adventurePointIncrease', [adventurePointsCacheKey]],
]);
