import { WithServerId } from 'interfaces/models/game/server';

export type MapFilterName =
  | 'shouldShowFactionReputation'
  | 'shouldShowOasisIcons'
  | 'shouldShowTroopMovements'
  | 'shouldShowWheatFields'
  | 'shouldShowTileTooltips'
  | 'shouldShowTreasureIcons';

export type MapFilters = WithServerId<Record<MapFilterName, boolean>>;
