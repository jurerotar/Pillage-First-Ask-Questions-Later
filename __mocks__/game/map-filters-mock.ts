import type { MapFilters } from 'interfaces/models/game/map-filters';
import { serverMock } from 'mocks/models/game/server-mock';

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
