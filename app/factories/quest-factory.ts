import { createBuildingQuest, generateVillageQuests, globalQuests } from 'app/(game)/(village-slug)/assets/quests';
import type { Quest, VillageQuest } from 'app/interfaces/models/game/quest';
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

export const newVillageQuestsFactory = (villageId: Village['id'], tribe: PlayableTribe): VillageQuest[] => {
  const wallBuildingId = tribeToWallBuildingIdMap.get(tribe)!;

  const villageQuests = generateVillageQuests(villageId);

  return [
    createBuildingQuest(villageId, wallBuildingId, 1),
    createBuildingQuest(villageId, wallBuildingId, 5),
    createBuildingQuest(villageId, wallBuildingId, 10),
    createBuildingQuest(villageId, wallBuildingId, 15),
    createBuildingQuest(villageId, wallBuildingId, 20),
    ...villageQuests,
  ];
};

export const generateNewServerQuests = (villageId: Village['id'], tribe: PlayableTribe): Quest[] => {
  return [...globalQuests, ...newVillageQuestsFactory(villageId, tribe)];
};
