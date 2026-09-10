type MapFilterName =
  | 'shouldShowFactionReputation'
  | 'shouldShowOasisIcons'
  | 'shouldShowTroopMovements'
  | 'shouldShowWheatFields'
  | 'shouldShowTileTooltips';

export type MapFilters = Record<MapFilterName, boolean>;
