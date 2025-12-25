import { createBuildingQuest, villageQuests } from 'app/assets/quests';
import type { Building } from 'app/interfaces/models/game/building';
import type { VillageQuest } from 'app/interfaces/models/game/quest';
import type { PlayableTribe } from 'app/interfaces/models/game/tribe';
import type { Village } from 'app/interfaces/models/game/village';

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
