export type MapFiltersModel = {
  should_show_faction_reputation: boolean;
  should_show_oasis_icons: boolean;
  should_show_troop_movements: boolean;
  should_show_wheat_fields: boolean;
  should_show_tile_tooltips: boolean;
  should_show_treasure_icons: boolean;
};

export type MapFilterName =
  | 'shouldShowFactionReputation'
  | 'shouldShowOasisIcons'
  | 'shouldShowTroopMovements'
  | 'shouldShowWheatFields'
  | 'shouldShowTileTooltips'
  | 'shouldShowTreasureIcons';

export type MapFilters = Record<MapFilterName, boolean>;
