import type { Village } from 'app/interfaces/models/game/village';
import {
  npcVillageNameAdjectives,
  npcVillageNameNouns,
} from 'app/assets/village';

export const getVillageName = (
  nameOrBitpackedName: Village['name'],
): string => {
  if (typeof nameOrBitpackedName === 'string') {
    return nameOrBitpackedName;
  }

  const nounIndex = nameOrBitpackedName % npcVillageNameNouns.length;
  const adjectiveIndex = Math.floor(
    nameOrBitpackedName / npcVillageNameNouns.length,
  );

  return `${npcVillageNameAdjectives[adjectiveIndex]}${npcVillageNameNouns[nounIndex]}`;
};
