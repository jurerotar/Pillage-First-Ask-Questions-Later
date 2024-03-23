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
  | 'players'
  | 'reputations'
  | 'researchLevels'
  | 'auctions'
  | 'mapMarkers'
  | 'adventures'
  | 'mapFilters'
  | 'troops';

export type TableName = CommonTableName | ServerSpecificTableName;
