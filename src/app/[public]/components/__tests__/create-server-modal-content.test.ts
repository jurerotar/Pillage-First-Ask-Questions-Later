import { beforeAll, describe, test } from 'vitest';
import 'fake-indexeddb/auto';
import { database } from 'database/database';
import { serverMock } from 'mocks/models/game/server-mock';
import '@vitest/web-worker';
import { initializeServer } from 'app/[public]/components/create-server-modal-content';

const { id: serverId } = serverMock;

beforeAll(async () => {
  await initializeServer({ server: serverMock });
  // This is needed because it otherwise counts time to seed database in the first test, timing it out
  await database.villages.get(1);
});

describe('initializeServer', () => {
  describe('factions', async () => {
    const _reputations = await database.reputations.where({ serverId }).toArray();
    test.todo('Creates factions', () => {});
  });

  describe('players', async () => {
    const _players = await database.players.where({ serverId }).toArray();
    test.todo('Creates players', () => {});
  });

  describe('map', async () => {
    const _map = await database.maps.where({ serverId }).toArray();
    test.todo('Creates map', () => {});
  });

  describe('villages', async () => {
    const _villages = await database.villages.where({ serverId }).toArray();
    test.todo('Creates villages', () => {});
  });

  describe('troops', async () => {
    const _troops = await database.troops.where({ serverId }).toArray();
    test.todo('Creates troops', () => {});
  });

  describe('researchLevels', async () => {
    const _researchLevels = await database.researchLevels.where({ serverId }).toArray();
    test.todo('Creates researchLevels', () => {});
  });

  describe('quests', async () => {
    const _quests = await database.quests.where({ serverId }).count();
    test.todo('Creates quests', () => {});
  });

  describe('achievements', async () => {
    const _achievements = await database.achievements.where({ serverId }).count();
    test.todo('Creates achievements', () => {});
  });

  describe('effects', async () => {
    const _effects = await database.effects.where({ serverId }).count();
    test.todo('Creates effects', () => {});
  });

  describe('events', async () => {
    const _events = await database.events.where({ serverId }).count();
    test.todo('Creates events', () => {});
  });
});
