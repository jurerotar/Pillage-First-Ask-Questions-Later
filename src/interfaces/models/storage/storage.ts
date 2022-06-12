export type IndexedDBKey =
  'map'
  | 'playerVillages'
  | 'hero'
  | 'researchLevels'
  | 'reports'
  | 'quests'
  | 'achievements'
  | 'accountEffects'
  | 'events';

export type LocalForageKey = `${string}-${IndexedDBKey}`;
