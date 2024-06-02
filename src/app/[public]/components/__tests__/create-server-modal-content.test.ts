import { beforeAll, describe, expect, test } from 'vitest';
import { serverMock } from 'mocks/models/game/server-mock';
import '@vitest/web-worker';
import { initializeServer } from 'app/[public]/components/create-server-modal-content';
import { isOasisTile, isOccupiedOasisTile, isOccupiedOccupiableTile } from 'app/[game]/utils/guards/map-guards';
import type { OccupiedOasisTile, Tile } from 'interfaces/models/game/tile';
import 'packages/vitest-opfs-mock';
import { getParsedFileContents, getServerHandle } from 'app/utils/opfs';
import type { Reputation } from 'interfaces/models/game/reputation';
import type { Player } from 'interfaces/models/game/player';
import type { Effect } from 'interfaces/models/game/effect';
import type { GameEvent } from 'interfaces/models/events/game-event';
import type { Achievement } from 'interfaces/models/game/achievement';
import type { Quest } from 'interfaces/models/game/quest';
import type { Village } from 'interfaces/models/game/village';
import type { Troop } from 'interfaces/models/game/troop';

let serverHandle: FileSystemDirectoryHandle;

beforeAll(async () => {
  await initializeServer({ server: serverMock });
  serverHandle = await getServerHandle(serverMock.slug);
});

// TODO: Write these tests

describe('Server initialization', () => {
  describe('Factions', () => {
    test('There should be 9 factions', async () => {
      const reputations = await getParsedFileContents<Reputation[]>(serverHandle, 'reputations');
      expect(reputations.length).toBe(9);
    });
  });

  describe('Players', () => {
    test('There should be 51 players', async () => {
      const players = await getParsedFileContents<Player[]>(serverHandle, 'players');
      expect(players.length).toBe(51);
    });
  });

  describe('Map', () => {
    test('There should be exactly (size + 1)**2 tiles', async () => {
      const tiles = await getParsedFileContents<Tile[]>(serverHandle, 'map');
      expect(tiles.length).toBe((serverMock.configuration.mapSize + 1) ** 2);
    });

    test("Each tile should have a type and each tile's type should either be free-tile or oasis-tile", async () => {
      const tiles = await getParsedFileContents<Tile[]>(serverHandle, 'map');
      expect(tiles.every((tile) => Object.hasOwn(tile, 'type') && ['free-tile', 'oasis-tile'].includes(tile.type))).toBe(true);
    });

    test("Each tile's coordinates should be between [-size/2, size/2]", async () => {
      const limit = serverMock.configuration.mapSize / 2;
      const tiles = await getParsedFileContents<Tile[]>(serverHandle, 'map');
      expect(tiles.every(({ coordinates: { x, y } }) => x >= -limit && x <= limit && y >= -limit && y <= limit)).toBe(true);
    });

    test('Some oasis tile should have no bonus', async () => {
      const tiles = await getParsedFileContents<Tile[]>(serverHandle, 'map');
      const oasisTiles = tiles.filter(isOasisTile);
      expect(oasisTiles.some(({ oasisResourceBonus }) => oasisResourceBonus.length === 0)).toBe(true);
    });

    test('Some oasis tile should have only 25% single-resource bonus', async () => {
      const tiles = await getParsedFileContents<Tile[]>(serverHandle, 'map');
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
      const tiles = await getParsedFileContents<Tile[]>(serverHandle, 'map');
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
      const tiles = await getParsedFileContents<Tile[]>(serverHandle, 'map');
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
      const tiles = await getParsedFileContents<Tile[]>(serverHandle, 'map');
      const occupiedOasisTiles = tiles.filter(isOccupiedOasisTile);

      expect(occupiedOasisTiles.length > 0).toBe(true);
    });

    test('No oasis should be occupied by villages of size "xs"', async () => {
      const tiles = await getParsedFileContents<Tile[]>(serverHandle, 'map');
      const occupiedOasisTiles = tiles.filter(isOccupiedOasisTile);
      const occupiedOccupiableTiles = tiles.filter(isOccupiedOccupiableTile);

      const extraSmallVillageTileIds = occupiedOccupiableTiles.filter(({ villageSize }) => villageSize === 'xs').map(({ id }) => id);
      const occupiedOasisVillageIds = occupiedOasisTiles.map(({ villageId }) => villageId);

      const listOfOccurrences = extraSmallVillageTileIds.map((id) => occupiedOasisVillageIds.filter((villageId) => villageId === id));
      expect(listOfOccurrences.every((occurrence) => occurrence.length === 0)).toBe(true);
    });

    // We're counting how many times occupying tile id appears in list of occupied oasis ids
    test('No more than 1 oasis per village should be occupied by villages of size "sm"', async () => {
      const tiles = await getParsedFileContents<Tile[]>(serverHandle, 'map');
      const occupiedOasisTiles = tiles.filter(isOccupiedOasisTile);
      const occupiedOccupiableTiles = tiles.filter(isOccupiedOccupiableTile);

      const smallVillageTileIds = occupiedOccupiableTiles.filter(({ villageSize }) => villageSize === 'sm').map(({ id }) => id);
      const occupiedOasisVillageIds = occupiedOasisTiles.map(({ villageId }) => villageId);

      const listOfOccurrences = smallVillageTileIds.map((id) => occupiedOasisVillageIds.filter((villageId) => villageId === id));
      expect(listOfOccurrences.every((occurrence) => occurrence.length <= 1)).toBe(true);
    });

    test('No more than 2 oasis per village should be occupied by villages of size "md"', async () => {
      const tiles = await getParsedFileContents<Tile[]>(serverHandle, 'map');
      const occupiedOasisTiles = tiles.filter(isOccupiedOasisTile);
      const occupiedOccupiableTiles = tiles.filter(isOccupiedOccupiableTile);

      const mediumVillageTileIds = occupiedOccupiableTiles.filter(({ villageSize }) => villageSize === 'md').map(({ id }) => id);
      const occupiedOasisVillageIds = occupiedOasisTiles.map(({ villageId }) => villageId);

      const listOfOccurrences = mediumVillageTileIds.map((id) => occupiedOasisVillageIds.filter((villageId) => villageId === id));
      expect(listOfOccurrences.every((occurrence) => occurrence.length <= 2)).toBe(true);
    });

    test('No more than 3 oasis per village should be occupied by villages of size "lg"', async () => {
      const tiles = await getParsedFileContents<Tile[]>(serverHandle, 'map');
      const occupiedOasisTiles = tiles.filter(isOccupiedOasisTile);
      const occupiedOccupiableTiles = tiles.filter(isOccupiedOccupiableTile);

      const largeVillageTileIds = occupiedOccupiableTiles.filter(({ villageSize }) => villageSize === 'md').map(({ id }) => id);
      const occupiedOasisVillageIds = occupiedOasisTiles.map(({ villageId }) => villageId);

      const listOfOccurrences = largeVillageTileIds.map((id) => occupiedOasisVillageIds.filter((villageId) => villageId === id));
      expect(listOfOccurrences.every((occurrence) => occurrence.length <= 3)).toBe(true);
    });

    test('Same seed should generate same map every time', async () => {
      const tiles = await getParsedFileContents<Tile[]>(serverHandle, 'map');

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
    test.todo('', async () => {
      const _villages = await getParsedFileContents<Village[]>(serverHandle, 'villages');
    });
  });

  describe('Troops', () => {
    test('Each troop should have correct server id', async () => {
      const _troops = await getParsedFileContents<Troop[]>(serverHandle, 'troops');
    });
  });

  describe('Quests', () => {
    test.todo('', async () => {
      const _quests = await getParsedFileContents<Quest[]>(serverHandle, 'quests');
    });
  });

  describe('Achievements', () => {
    test.todo('', async () => {
      const _achievements = await getParsedFileContents<Achievement[]>(serverHandle, 'achievements');
    });
  });

  describe('Effects', () => {
    test.todo('', async () => {
      const _effects = await getParsedFileContents<Effect[]>(serverHandle, 'effects');
    });
  });

  describe('Events', () => {
    test.todo('', async () => {
      const _events = await getParsedFileContents<GameEvent[]>(serverHandle, 'events');
    });
  });
});
