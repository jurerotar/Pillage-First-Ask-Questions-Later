import { WithServerId } from 'interfaces/models/game/server';
import { PlayerFaction } from 'interfaces/models/game/player';

export type ReputationLevel =
  // Trade is possible. Trade ratio is set at 1:1. Faction may reinforce the player in defensive battles. Faction may offer quests.
  | 'ecstatic'
  // Trade is possible. Trade ratio is set at 2:1. Faction may offer quests.
  | 'respected'
  // Trade is possible. Trade ratio is set at 3:1. Faction may offer quests.
  | 'friendly'
  // Trade is possible. Trade ratio is set at 4:1.
  | 'neutral'
  // Trade is not possible. Faction will not be sending attacks and raids.
  | 'unfriendly'
  // Trade is not possible. Faction will be sending attacks and raids.
  | 'hostile';

export type Reputation = WithServerId<{
  faction: PlayerFaction;
  percentage: number;
  reputationLevel: ReputationLevel;
}>;
