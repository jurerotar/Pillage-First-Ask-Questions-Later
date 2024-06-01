export type MapFilterName =
  | 'shouldShowFactionReputation'
  | 'shouldShowOasisIcons'
  | 'shouldShowTroopMovements'
  | 'shouldShowWheatFields'
  | 'shouldShowTileTooltips'
  | 'shouldShowTreasureIcons';

export type MapFilters = Record<MapFilterName, boolean>;
