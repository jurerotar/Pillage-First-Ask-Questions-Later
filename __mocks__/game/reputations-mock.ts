import { Reputation } from 'interfaces/models/game/reputation';
import { npcReputationMock, playerReputationMock } from 'mocks/models/game/reputation-mock';

export const reputationsMock: Reputation[] = [
  playerReputationMock,
  {
    ...npcReputationMock,
  },
  {
    ...npcReputationMock,
    faction: 'npc2',
  },
  {
    ...npcReputationMock,
    faction: 'npc3',
  },
  {
    ...npcReputationMock,
    faction: 'npc4',
  },
  {
    ...npcReputationMock,
    faction: 'npc5',
  },
  {
    ...npcReputationMock,
    faction: 'npc6',
  },
  {
    ...npcReputationMock,
    faction: 'npc7',
  },
  {
    ...npcReputationMock,
    faction: 'npc8',
  },
];
