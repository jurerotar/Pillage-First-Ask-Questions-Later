import { beforeAll, describe, expect, test } from 'vitest';
import 'fake-indexeddb/auto';
import { database } from 'database/database';
import { serverMock } from 'mocks/models/game/server-mock';
import '@vitest/web-worker';
import { initializeServer } from 'app/[public]/components/create-server-modal-content';
import { getReputations } from 'app/[game]/hooks/use-reputations';
import { getPlayers } from 'app/[game]/hooks/use-players';
import { getMap } from 'app/[game]/hooks/use-map';
import { getVillages } from 'app/[game]/hooks/use-villages';
import { getTroops } from 'app/[game]/hooks/use-troops';
import { getResearchLevels } from 'app/[game]/hooks/use-research-levels';
import { getQuests } from 'app/[game]/hooks/use-quests';
import { getAchievements } from 'app/[game]/hooks/use-achievements';
import { getEffects } from 'app/[game]/hooks/use-effects';
import { getEvents } from 'app/[game]/hooks/use-events';

const { id: serverId } = serverMock;

beforeAll(async () => {
  await initializeServer({ server: serverMock });
  // This is needed because it otherwise counts time to seed database in the first test, timing it out
  await database.villages.get(1);
});

describe('Server initialization', () => {
  describe('Reputations', () => {
    test('Creates factions', async () => {
      const reputations = await getReputations(serverId);
      expect(reputations.length).not.toBe(0);
    });
  });

  describe('Players', () => {
    test.todo('Creates players', async () => {
      const _players = await getPlayers(serverId);
    });
  });

  describe('Map', () => {
    test.todo('Creates map', async () => {
      const _tiles = getMap(serverId);
    });
  });

  describe('Villages', () => {
    test.todo('Creates villages', async () => {
      const _villages = await getVillages(serverId);
    });
  });

  describe('Troops', () => {
    test.todo('Creates troops', async () => {
      const _troops = await getTroops(serverId);
    });
  });

  describe('Research levels', () => {
    test.todo('Creates research levels', async () => {
      const _researchLevels = await getResearchLevels(serverId);
    });
  });

  describe('Quests', () => {
    test.todo('Creates quests', async () => {
      const _quests = await getQuests(serverId);
    });
  });

  describe('Achievements', () => {
    test.todo('Creates achievements', async () => {
      const _achievements = await getAchievements(serverId);
    });
  });

  describe('Effects', () => {
    test.todo('Creates effects', async () => {
      const _effects = await getEffects(serverId);
    });
  });

  describe('Events', () => {
    test.todo('Creates events', async () => {
      const _events = await getEvents(serverId);
    });
  });
});
