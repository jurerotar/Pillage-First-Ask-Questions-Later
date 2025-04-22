import { createBuildingQuest, globalQuests, villageQuests } from 'app/(game)/(village-slug)/assets/quests';
import type { Quest } from 'app/interfaces/models/game/quest';
import type { Village } from 'app/interfaces/models/game/village';
import type { PlayableTribe } from 'app/interfaces/models/game/tribe';
import type { Building } from 'app/interfaces/models/game/building';

const tribeToWallBuildingIdMap = new Map<PlayableTribe, Building['id']>([
  ['romans', 'CITY_WALL'],
  ['gauls', 'PALISADE'],
  ['teutons', 'EARTH_WALL'],
  ['huns', 'MAKESHIFT_WALL'],
  ['egyptians', 'STONE_WALL'],
]);

export const newVillageQuestsFactory = (villageId: Village['id'], tribe: PlayableTribe): Quest[] => {
  const wallBuildingId = tribeToWallBuildingIdMap.get(tribe)!;

  const quests = [
    createBuildingQuest(wallBuildingId, 1),
    createBuildingQuest(wallBuildingId, 5),
    createBuildingQuest(wallBuildingId, 10),
    createBuildingQuest(wallBuildingId, 15),
    createBuildingQuest(wallBuildingId, 20),
    ...villageQuests,
  ];

  return quests.map((quest) => ({
    villageId,
    ...quest
  }));
};

export const generateNewServerQuests = (villageId: Village['id'], tribe: PlayableTribe): Quest[] => {
  return [...globalQuests, ...newVillageQuestsFactory(villageId, tribe)];
};
