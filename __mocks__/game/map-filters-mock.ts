import { serverMock } from 'mocks/models/game/server-mock';
import { MapFilters } from 'interfaces/models/game/preferences/map-filters';

const { id: serverId } = serverMock;

export const mapFiltersMock: MapFilters = {
  serverId,
  shouldShowFactionReputation: true,
  shouldShowOasisIcons: true,
  shouldShowTileTooltips: true,
  shouldShowTreasureIcons: true,
  shouldShowTroopMovements: true,
  shouldShowWheatFields: true,
};
