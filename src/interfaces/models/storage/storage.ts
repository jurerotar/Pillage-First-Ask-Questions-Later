export type IndexedDBKeys =
  '-mapData'
  | '-playerVillageData'
  | '-heroData'
  | '-researchLevels'
  | '-reports'
  | '-quests'
  | '-achievements';

export type LocalForageKey = `${string}-${IndexedDBKeys}`;
