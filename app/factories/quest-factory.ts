import {
  createBuildingQuest,
  globalQuests,
  villageQuests,
} from 'app/assets/quests';
import type { Quest, VillageQuest } from 'app/interfaces/models/game/quest';
import type { Village } from 'app/interfaces/models/game/village';
import type { PlayableTribe } from 'app/interfaces/models/game/tribe';
import type { Building } from 'app/interfaces/models/game/building';

export const newVillageQuestsFactory = (
  villageId: Village['id'],
  tribe: PlayableTribe,
): VillageQuest[] => {
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

  const questsWithVillageId = questsToCreate.map((quest) => ({
    ...quest,
    villageId,
  }));

  return questsWithVillageId.map((quest) => ({
    ...quest,
    collectedAt: null,
    completedAt: null,
  }));
};

export const generateNewServerQuests = (
  villageId: Village['id'],
  tribe: PlayableTribe,
): Quest[] => {
  const collectableGlobalQuests = globalQuests.map((quest) => ({
    ...quest,
    collectedAt: null,
    completedAt: null,
  }));

  const collectableVillageQuests = newVillageQuestsFactory(villageId, tribe);

  return [...collectableGlobalQuests, ...collectableVillageQuests];
};
