import type { FactionModel } from 'app/interfaces/models/game/faction';

export type FactionReputationModel = {
  id: number;
  source_faction: FactionModel['name'];
  target_faction: FactionModel['name'];
  reputation: number;
};
