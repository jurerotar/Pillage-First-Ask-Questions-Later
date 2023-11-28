import { Server } from 'interfaces/models/game/server';

export const serverMock: Server = {
  seed: '23223ca711',
  name: 'server-067b',
  configuration: {
    mapSize: 100,
    speed: 1,
  },
  playerConfiguration: {
    tribe: 'gauls',
  },
  id: 'b27f14e1-4b45-443b-a89d-adb0b0179bf3',
  slug: 'server-067b',
  startDate: '2023-09-21T09:46:04.435Z',
};

export const gaulServerMock: Server = {
  ...serverMock,
};

export const teutonServerMock: Server = {
  ...serverMock,
  playerConfiguration: {
    tribe: 'teutons',
  },
};

export const romanServerMock: Server = {
  ...serverMock,
  playerConfiguration: {
    tribe: 'romans',
  },
};

export const egyptianServerMock: Server = {
  ...serverMock,
  playerConfiguration: {
    tribe: 'egyptians',
  },
};

export const hunServerMock: Server = {
  ...serverMock,
  playerConfiguration: {
    tribe: 'huns',
  },
};

export const spartanServerMock: Server = {
  ...serverMock,
  playerConfiguration: {
    tribe: 'spartans',
  },
};
