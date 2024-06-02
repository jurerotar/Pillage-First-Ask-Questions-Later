import type { Player } from 'interfaces/models/game/player';

export const playerMock: Player = {
  id: '42c53448-ab04-4ae3-8ce5-dccad55162a7',
  name: 'Player name',
  faction: 'player',
  tribe: 'romans',
};

export const npcPlayerMock: Player = {
  id: '524228a8-8610-43cf-807b-af241f18ba13',
  name: 'Npc name',
  faction: 'npc3',
  tribe: 'romans',
};

export const playersMock: Player[] = [
  playerMock,
  {
    id: '524228a8-8610-43cf-807b-af241f18ba13',
    name: 'Npc name',
    faction: 'npc3',
    tribe: 'romans',
  },
  {
    id: 'b2949612-7e4f-4695-8cb4-0f0b636a2d3e',
    name: 'Npc name',
    faction: 'npc2',
    tribe: 'romans',
  },
  {
    id: 'c6be0a22-d6d2-4b79-a837-e844a4a865f3',
    name: 'Npc name',
    faction: 'npc4',
    tribe: 'romans',
  },
  {
    id: 'dfacafb5-e241-4d4d-b673-ff56f6bcf03b',
    name: 'Npc name',
    faction: 'npc1',
    tribe: 'romans',
  },
];
