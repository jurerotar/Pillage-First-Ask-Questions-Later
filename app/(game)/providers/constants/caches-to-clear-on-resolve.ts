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
import type { GameEvent } from 'app/interfaces/models/game/game-event';

export const cachesToClearOnResolve = new Map<GameEvent['type'], string[]>([
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
