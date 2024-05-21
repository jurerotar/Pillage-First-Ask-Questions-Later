import type { MapFilters } from 'interfaces/models/game/map-filters';
import type { Server } from 'interfaces/models/game/server';

type MapFiltersFactoryProps = {
  server: Server;
};

export const mapFiltersFactory = ({ server: { id: serverId } }: MapFiltersFactoryProps): MapFilters => {
  return {
    serverId,
    shouldShowFactionReputation: true,
    shouldShowOasisIcons: true,
    shouldShowTroopMovements: true,
    shouldShowWheatFields: true,
    shouldShowTileTooltips: true,
    shouldShowTreasureIcons: true,
  };
};
