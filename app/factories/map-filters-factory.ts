import type { MapFilters } from 'app/interfaces/models/game/map-filters';

export const mapFiltersFactory = (): MapFilters => {
  return {
    shouldShowFactionReputation: false,
    shouldShowOasisIcons: true,
    shouldShowTroopMovements: true,
    shouldShowWheatFields: true,
    shouldShowTileTooltips: true,
    shouldShowTreasureIcons: true,
  };
};
