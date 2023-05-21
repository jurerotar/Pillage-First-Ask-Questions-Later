export type IndexedDBKey =
  | 'map'
  | 'playerVillages'
  | 'hero'
  | 'researchLevels'
  | 'reports'
  | 'quests'
  | 'achievements'
  | 'accountEffects'
  | 'events';

export type LocalForageKey =
  | 'servers'
  | `${string}-${IndexedDBKey}`;
