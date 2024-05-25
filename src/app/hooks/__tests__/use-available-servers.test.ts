import { beforeAll, describe, expect, test } from 'vitest';
import 'fake-indexeddb/auto';
import { database } from 'database/database';
import { serverMock } from 'mocks/models/game/server-mock';
import '@vitest/web-worker';
import { initializeServer } from 'app/[public]/components/create-server-modal-content';
import { getReputations } from 'app/[game]/hooks/use-reputations';
import { deleteServerData } from 'app/hooks/use-available-servers';
import { getPlayers } from 'app/[game]/hooks/use-players';
import { getMap } from 'app/[game]/hooks/use-map';
import { getVillages } from 'app/[game]/hooks/use-villages';
import { getTroops } from 'app/[game]/hooks/use-troops';
import { getResearchLevels } from 'app/[game]/hooks/use-research-levels';
import { getQuests } from 'app/[game]/hooks/use-quests';
import { getAchievements } from 'app/[game]/hooks/use-achievements';
import { getEffects } from 'app/[game]/hooks/use-effects';
import { getEvents } from 'app/[game]/hooks/use-events';
import { getHero } from 'app/[game]/hooks/use-hero';
import { getMapMarkers } from 'app/[game]/[map]/hooks/use-map-markers';
import { getMapFilters } from 'app/[game]/[map]/hooks/use-map-filters';

const { id: serverId } = serverMock;

beforeAll(async () => {
  await initializeServer({ server: serverMock });
  // This is needed because it otherwise counts time to seed database in the first test, timing it out
  await database.villages.get(1);
});

describe('Server deletion', async () => {
  beforeAll(async () => {
    await deleteServerData(serverId);
  });

  test('Factions should get deleted on server deletion', async () => {
    const reputations = await getReputations(serverId);
    expect(reputations.length).toBe(0);
  });

  test('Players should get deleted on server deletion', async () => {
    const players = await getPlayers(serverId);
    expect(players.length).toBe(0);
  });

  test('Tiles should get deleted on server deletion', async () => {
    const tiles = await getMap(serverId);
    expect(tiles.length).toBe(0);
  });

  test('Villages should get deleted on server deletion', async () => {
    const villages = await getVillages(serverId);
    expect(villages.length).toBe(0);
  });

  test('Troops should get deleted on server deletion', async () => {
    const troops = await getTroops(serverId);
    expect(troops.length).toBe(0);
  });

  test('Research levels should get deleted on server deletion', async () => {
    const researchLevels = await getResearchLevels(serverId);
    expect(researchLevels.length).toBe(0);
  });

  test('Quests should get deleted on server deletion', async () => {
    const quests = await getQuests(serverId);
    expect(quests.length).toBe(0);
  });

  test('Achievements should get deleted on server deletion', async () => {
    const achievements = await getAchievements(serverId);
    expect(achievements.length).toBe(0);
  });

  test('Server data should get deleted on server deletion', async () => {
    const server = await database.servers.where({ id: serverId }).first();
    expect(server).toBe(undefined);
  });

  test('Hero should get deleted on server deletion', async () => {
    const hero = await getHero(serverId);
    expect(hero).toBe(undefined);
  });

  test('Achievements should get deleted on server deletion', async () => {
    const achievements = await getAchievements(serverId);
    expect(achievements.length).toBe(0);
  });

  test('Effects should get deleted on server deletion', async () => {
    const effects = await getEffects(serverId);
    expect(effects.length).toBe(0);
  });

  test('Events should get deleted on server deletion', async () => {
    const events = await getEvents(serverId);
    expect(events.length).toBe(0);
  });

  test('Map filters should get deleted on server deletion', async () => {
    const mapFilters = await getMapFilters(serverId);
    expect(mapFilters).toBe(undefined);
  });

  test('Map markers should get deleted on server deletion', async () => {
    const events = await getMapMarkers(serverId);
    expect(events.length).toBe(0);
  });

  test.todo('Adventures should get deleted on server deletion', async () => {
    const adventures = [];
    expect(adventures.length).toBe(0);
  });

  test.todo('Auctions should get deleted on server deletion', async () => {
    const auctions = [];
    expect(auctions.length).toBe(0);
  });
});
