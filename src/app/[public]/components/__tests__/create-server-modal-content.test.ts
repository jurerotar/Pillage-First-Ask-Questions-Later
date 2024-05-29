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
import { getQuests } from 'app/[game]/hooks/use-quests';
import { getAchievements } from 'app/[game]/hooks/use-achievements';
import { getEffects } from 'app/[game]/hooks/use-effects';
import { getEvents } from 'app/[game]/hooks/use-events';
import { isOasisTile, isOccupiedOasisTile, isOccupiedOccupiableTile } from 'app/[game]/utils/guards/map-guards';
import type { OccupiedOasisTile } from 'interfaces/models/game/tile';

const { id: serverId } = serverMock;

beforeAll(async () => {
  await initializeServer({ server: serverMock });
  // This is needed because it otherwise counts time to seed database in the first test, timing it out
  await database.villages.get(1);
});

// TODO: Write these tests

describe('Server initialization', () => {
  describe('Factions', () => {
    test('Each faction should have correct server id', async () => {
      const reputations = await getReputations(serverId);
      expect(reputations.every((reputation) => Object.hasOwn(reputation, 'serverId') && reputation.serverId === serverMock.id)).toBe(true);
    });
  });

  describe('Players', () => {
    test('Each player should have correct server id', async () => {
      const players = await getPlayers(serverId);
      expect(players.every((player) => Object.hasOwn(player, 'serverId') && player.serverId === serverMock.id)).toBe(true);
    });
  });

  describe('Map', () => {
    test('Each tile should have correct server id', async () => {
      const tiles = await getMap(serverId);
      expect(tiles.every((tile) => Object.hasOwn(tile, 'serverId') && tile.serverId === serverMock.id)).toBe(true);
    });

    test('There should be exactly (size + 1)**2 tiles', async () => {
      const tiles = await getMap(serverId);
      expect(tiles.length).toBe((serverMock.configuration.mapSize + 1) ** 2);
    });

    test("Each tile should have a type and each tile's type should either be free-tile or oasis-tile", async () => {
      const tiles = await getMap(serverId);
      expect(tiles.every((tile) => Object.hasOwn(tile, 'type') && ['free-tile', 'oasis-tile'].includes(tile.type))).toBe(true);
    });

    test("Each tile's coordinates should be between [-size/2, size/2]", async () => {
      const limit = serverMock.configuration.mapSize / 2;
      const tiles = await getMap(serverId);
      expect(tiles.every(({ coordinates: { x, y } }) => x >= -limit && x <= limit && y >= -limit && y <= limit)).toBe(true);
    });

    test('Some oasis tile should have no bonus', async () => {
      const tiles = await getMap(serverId);
      const oasisTiles = tiles.filter(isOasisTile);
      expect(oasisTiles.some(({ oasisResourceBonus }) => oasisResourceBonus.length === 0)).toBe(true);
    });

    test('Some oasis tile should have only 25% single-resource bonus', async () => {
      const tiles = await getMap(serverId);
      const oasisTiles = tiles.filter(isOasisTile);

      expect(
        oasisTiles.some(({ oasisResourceBonus }) => {
          if (oasisResourceBonus.length !== 1) {
            return false;
          }
          const { bonus } = oasisResourceBonus[0];
          return bonus === '25%';
        })
      ).toBe(true);
    });

    test('Some oasis tile should have 50% single-resource bonus', async () => {
      const tiles = await getMap(serverId);
      const oasisTiles = tiles.filter(isOasisTile);

      expect(
        oasisTiles.some(({ oasisResourceBonus }) => {
          if (oasisResourceBonus.length !== 1) {
            return false;
          }
          const { bonus } = oasisResourceBonus[0];
          return bonus === '50%';
        })
      ).toBe(true);
    });

    test('Some oasis tile should have double 25% single-resource bonus', async () => {
      const tiles = await getMap(serverId);
      const oasisTiles = tiles.filter(isOasisTile);

      expect(
        oasisTiles.some(({ oasisResourceBonus }) => {
          if (oasisResourceBonus.length !== 2) {
            return false;
          }
          const [firstBonus, secondBonus] = oasisResourceBonus;
          return firstBonus.bonus === '25%' && secondBonus.bonus === '25%';
        })
      ).toBe(true);
    });

    test('Some oasis should be occupied by npc players', async () => {
      const tiles = await getMap(serverId);
      const occupiedOasisTiles = tiles.filter(isOccupiedOasisTile);

      expect(occupiedOasisTiles.length > 0).toBe(true);
    });

    test('No oasis should be occupied by villages of size "xs"', async () => {
      const tiles = await getMap(serverId);
      const occupiedOasisTiles = tiles.filter(isOccupiedOasisTile);
      const occupiedOccupiableTiles = tiles.filter(isOccupiedOccupiableTile);

      const extraSmallVillageTileIds = occupiedOccupiableTiles.filter(({ villageSize }) => villageSize === 'xs').map(({ id }) => id);
      const occupiedOasisVillageIds = occupiedOasisTiles.map(({ villageId }) => villageId);

      const listOfOccurrences = extraSmallVillageTileIds.map((id) => occupiedOasisVillageIds.filter((villageId) => villageId === id));
      expect(listOfOccurrences.every((occurrence) => occurrence.length === 0)).toBe(true);
    });

    // We're counting how many times occupying tile id appears in list of occupied oasis ids
    test('No more than 1 oasis per village should be occupied by villages of size "sm"', async () => {
      const tiles = await getMap(serverId);
      const occupiedOasisTiles = tiles.filter(isOccupiedOasisTile);
      const occupiedOccupiableTiles = tiles.filter(isOccupiedOccupiableTile);

      const smallVillageTileIds = occupiedOccupiableTiles.filter(({ villageSize }) => villageSize === 'sm').map(({ id }) => id);
      const occupiedOasisVillageIds = occupiedOasisTiles.map(({ villageId }) => villageId);

      const listOfOccurrences = smallVillageTileIds.map((id) => occupiedOasisVillageIds.filter((villageId) => villageId === id));
      expect(listOfOccurrences.every((occurrence) => occurrence.length <= 1)).toBe(true);
    });

    test('No more than 2 oasis per village should be occupied by villages of size "md"', async () => {
      const tiles = await getMap(serverId);
      const occupiedOasisTiles = tiles.filter(isOccupiedOasisTile);
      const occupiedOccupiableTiles = tiles.filter(isOccupiedOccupiableTile);

      const mediumVillageTileIds = occupiedOccupiableTiles.filter(({ villageSize }) => villageSize === 'md').map(({ id }) => id);
      const occupiedOasisVillageIds = occupiedOasisTiles.map(({ villageId }) => villageId);

      const listOfOccurrences = mediumVillageTileIds.map((id) => occupiedOasisVillageIds.filter((villageId) => villageId === id));
      expect(listOfOccurrences.every((occurrence) => occurrence.length <= 2)).toBe(true);
    });

    test('No more than 3 oasis per village should be occupied by villages of size "lg"', async () => {
      const tiles = await getMap(serverId);
      const occupiedOasisTiles = tiles.filter(isOccupiedOasisTile);
      const occupiedOccupiableTiles = tiles.filter(isOccupiedOccupiableTile);

      const largeVillageTileIds = occupiedOccupiableTiles.filter(({ villageSize }) => villageSize === 'md').map(({ id }) => id);
      const occupiedOasisVillageIds = occupiedOasisTiles.map(({ villageId }) => villageId);

      const listOfOccurrences = largeVillageTileIds.map((id) => occupiedOasisVillageIds.filter((villageId) => villageId === id));
      expect(listOfOccurrences.every((occurrence) => occurrence.length <= 3)).toBe(true);
    });

    test('Same seed should generate same map every time', async () => {
      const tiles = await getMap(serverId);

      // Doesn't really matter which 3 we pick, since the chance of these 3 being the same and seeding not working is basically 0
      const tile1 = tiles.find(({ coordinates: { x, y } }) => x === 2 && y === 0)! as OccupiedOasisTile;
      const tile2 = tiles.find(({ coordinates: { x, y } }) => x === -4 && y === -1)! as OccupiedOasisTile;
      const tile3 = tiles.find(({ coordinates: { x, y } }) => x === 2 && y === -2)! as OccupiedOasisTile;

      expect(tile1.graphics.oasisResource === 'iron' && tile1.oasisResourceBonus[0].bonus === '25%').toBe(true);
      expect(tile2.graphics.oasisResource === 'iron' && tile2.oasisResourceBonus[0].bonus === '25%').toBe(true);
      expect(
        tile3.graphics.oasisResource === 'clay' &&
          tile3.oasisResourceBonus[0].bonus === '25%' &&
          tile3.oasisResourceBonus[1].bonus === '25%'
      ).toBe(true);
    });
  });

  describe('Villages', () => {
    test('Each village should have correct server id', async () => {
      const villages = await getVillages(serverId);
      expect(villages.every((village) => Object.hasOwn(village, 'serverId') && village.serverId === serverMock.id)).toBe(true);
    });
  });

  describe('Troops', () => {
    test('Each troop should have correct server id', async () => {
      const troops = await getTroops(serverId);
      expect(troops.every((troop) => Object.hasOwn(troop, 'serverId') && troop.serverId === serverMock.id)).toBe(true);
    });
  });

  describe('Quests', () => {
    test('Each quest should have correct server id', async () => {
      const quests = await getQuests(serverId);
      expect(quests.every((quest) => Object.hasOwn(quest, 'serverId') && quest.serverId === serverMock.id)).toBe(true);
    });
  });

  describe('Achievements', () => {
    test('Each achievement should have correct server id', async () => {
      const achievements = await getAchievements(serverId);
      expect(achievements.every((achievement) => Object.hasOwn(achievement, 'serverId') && achievement.serverId === serverMock.id)).toBe(
        true
      );
    });
  });

  describe('Effects', () => {
    test('Each effect should have correct server id', async () => {
      const effects = await getEffects(serverId);
      expect(effects.every((effect) => Object.hasOwn(effect, 'serverId') && effect.serverId === serverMock.id)).toBe(true);
    });
  });

  describe('Events', () => {
    test('Each event should have correct server id', async () => {
      const events = await getEvents(serverId);
      expect(events.every((event) => Object.hasOwn(event, 'serverId') && event.serverId === serverMock.id)).toBe(true);
    });
  });
});
