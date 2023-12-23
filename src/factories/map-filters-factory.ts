import { Server } from 'interfaces/models/game/server';
import { MapFilters } from 'interfaces/models/game/map-filters';

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
