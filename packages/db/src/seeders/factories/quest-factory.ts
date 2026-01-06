import {
  createBuildingQuest,
  villageQuests,
} from '@pillage-first/game-assets/quests';
import type { Building } from '@pillage-first/types/models/building';
import type { VillageQuest } from '@pillage-first/types/models/quest';
import type { PlayableTribe } from '@pillage-first/types/models/tribe';
import type { Village } from '@pillage-first/types/models/village';

export const newVillageQuestsFactory = (
  villageId: Village['id'],
  tribe: PlayableTribe,
): Omit<VillageQuest, 'collectedAt' | 'completedAt'>[] => {
  const tribeToWallBuildingIdMap = new Map<PlayableTribe, Building['id']>([
    ['romans', 'CITY_WALL'],
    ['gauls', 'PALISADE'],
    ['teutons', 'EARTH_WALL'],
    ['huns', 'MAKESHIFT_WALL'],
    ['egyptians', 'STONE_WALL'],
  ]);

  const tribalWall = tribeToWallBuildingIdMap.get(tribe)!;

  const questsToCreate = [
    ...villageQuests,
    createBuildingQuest(tribalWall, 1),
    createBuildingQuest(tribalWall, 5),
    createBuildingQuest(tribalWall, 10),
    createBuildingQuest(tribalWall, 15),
    createBuildingQuest(tribalWall, 20),
  ];

  return questsToCreate.map((quest) => ({
    ...quest,
    villageId,
  }));
};
