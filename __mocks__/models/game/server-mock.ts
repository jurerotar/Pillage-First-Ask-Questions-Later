import type { Server } from 'interfaces/models/game/server';

export const serverMock: Server = {
  seed: '23223ca711',
  name: 's-067b',
  configuration: {
    mapSize: 100,
    speed: 1,
  },
  playerConfiguration: {
    name: 'Player name',
    tribe: 'gauls',
  },
  statistics: {
    lastLoggedInTime: 1695289564435,
  },
  id: 'b27f14e1-4b45-443b-a89d-adb0b0179bf3',
  slug: 's-067b',
  createdAt: 1695289564435,
};

export const gaulServerMock: Server = {
  ...serverMock,
};

export const teutonServerMock: Server = {
  ...serverMock,
  playerConfiguration: {
    ...serverMock.playerConfiguration,
    tribe: 'teutons',
  },
};

export const romanServerMock: Server = {
  ...serverMock,
  playerConfiguration: {
    ...serverMock.playerConfiguration,
    tribe: 'romans',
  },
};

export const egyptianServerMock: Server = {
  ...serverMock,
  playerConfiguration: {
    ...serverMock.playerConfiguration,
    tribe: 'egyptians',
  },
};

export const hunServerMock: Server = {
  ...serverMock,
  playerConfiguration: {
    ...serverMock.playerConfiguration,
    tribe: 'huns',
  },
};

export const spartanServerMock: Server = {
  ...serverMock,
  playerConfiguration: {
    ...serverMock.playerConfiguration,
    tribe: 'spartans',
  },
};

export const natarServerMock: Server = {
  ...serverMock,
  playerConfiguration: {
    ...serverMock.playerConfiguration,
    tribe: 'natars',
  },
};
