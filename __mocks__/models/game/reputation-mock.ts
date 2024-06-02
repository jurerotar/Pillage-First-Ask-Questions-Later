import type { Reputation } from 'interfaces/models/game/reputation';

export const playerReputationMock: Reputation = {
  faction: 'player',
  percentage: 0,
  reputationLevel: 'player',
};

export const npcReputationMock: Reputation = {
  faction: 'npc1',
  percentage: 0,
  reputationLevel: 'friendly',
};
