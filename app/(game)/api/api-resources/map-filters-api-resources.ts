import type {
  MapFilters,
  MapFiltersModel,
} from 'app/interfaces/models/game/map-filters';

export const mapFiltersApiResource = (
  mapFiltersModel: MapFiltersModel,
): MapFilters => {
  return {
    shouldShowFactionReputation: mapFiltersModel.should_show_faction_reputation,
    shouldShowOasisIcons: mapFiltersModel.should_show_oasis_icons,
    shouldShowTileTooltips: mapFiltersModel.should_show_tile_tooltips,
    shouldShowTreasureIcons: mapFiltersModel.should_show_treasure_icons,
    shouldShowTroopMovements: mapFiltersModel.should_show_troop_movements,
    shouldShowWheatFields: mapFiltersModel.should_show_wheat_fields,
  };
};
