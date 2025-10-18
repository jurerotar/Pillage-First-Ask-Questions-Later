import type {
  FactionName,
  FactionModel,
} from 'app/interfaces/models/game/faction';

export type FactionReputationModel = {
  id: number;
  source_faction: FactionModel['name'];
  target_faction: FactionModel['name'];
  reputation: number;
};

export type ReputationLevel =
  // Essentially a 'helper' reputation, this makes sure we don't have to have a bunch of hacks throughout the codebase
  | 'player'
  // Trade is possible. Trade ratio is set at 1:1. Faction may reinforce the player in defensive battles. Faction may offer quests.
  | 'ecstatic'
  | 'honored'
  // Trade is possible. Trade ratio is set at 2:1. Faction may offer quests.
  | 'respected'
  // Trade is possible. Trade ratio is set at 3:1. Faction may offer quests.
  | 'friendly'
  // Trade is possible. Trade ratio is set at 4:1.
  | 'neutral'
  // Trade is not possible. Faction will not be sending attacks and raids.
  | 'unfriendly'
  // Trade is not possible. Faction will be sending attacks and raids.
  | 'hostile'
  | 'hated';

export type Reputation = {
  faction: FactionName;
  percentage: number;
  reputationLevel: ReputationLevel;
};
