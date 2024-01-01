type CommonTableName = 'servers';

type ServerSpecificTableName =
  | 'maps'
  | 'heroes'
  | 'villages'
  | 'reports'
  | 'quests'
  | 'achievements'
  | 'events'
  | 'effects'
  | 'banks'
  | 'players'
  | 'reputations'
  | 'researchLevels'
  | 'mapMarkers'
  | 'mapFilters';

export type CryliteTableName = CommonTableName | ServerSpecificTableName;
