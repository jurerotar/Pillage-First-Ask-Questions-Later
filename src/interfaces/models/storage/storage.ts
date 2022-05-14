export type IndexedDBKeys =
  '-mapData'
  | '-playerVillagesData'
  | '-heroData'
  | '-researchLevels'
  | '-reports'
  | '-quests'
  | '-achievements';

export type LocalForageKey = `${string}-${IndexedDBKeys}`;
