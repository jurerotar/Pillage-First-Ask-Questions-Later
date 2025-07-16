import type { OasisTile } from 'app/interfaces/models/game/tile';
import type { Village } from 'app/interfaces/models/game/village';
import type { Player } from 'app/interfaces/models/game/player';

export type OccupiableOasisInRangeDTO = {
  oasis: OasisTile;
  village: Village | null;
  player: Player | null;
};
