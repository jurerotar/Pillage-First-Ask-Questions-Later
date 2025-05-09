import { isOasisTile, isOccupiedOasisTile, isOccupiedOccupiableTile } from 'app/(game)/(village-slug)/utils/guards/map-guards';
import type { OccupiedOasisTile, Tile } from 'app/interfaces/models/game/tile';
import { serverMock } from 'app/tests/mocks/game/server-mock';
import { beforeAll, describe, expect, test } from 'vitest';
import 'opfs-mock';
import '@vitest/web-worker';
import { hydrate, QueryClient } from '@tanstack/react-query';
import type { PersistedClient } from '@tanstack/react-query-persist-client';
import {
  effectsCacheKey,
  eventsCacheKey,
  mapCacheKey,
  questsCacheKey,
  serverCacheKey,
  troopsCacheKey,
  unitResearchCacheKey,
  villagesCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import { getVillageSize } from 'app/factories/utils/village';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import type { Effect } from 'app/interfaces/models/game/effect';
import type { Quest } from 'app/interfaces/models/game/quest';
import type { Server } from 'app/interfaces/models/game/server';
import type { Troop } from 'app/interfaces/models/game/troop';
import type { UnitResearch } from 'app/interfaces/models/game/unit-research';
import type { Village } from 'app/interfaces/models/game/village';
import { getParsedFileContents, getRootHandle } from 'app/utils/opfs';
import { decodeGraphicsProperty, parseCoordinatesFromTileId } from 'app/utils/map-tile';
import { initializeServer } from 'app/(public)/(create-new-server)/utils/create-new-server';

const queryClient = new QueryClient();

beforeAll(async () => {
  await initializeServer(serverMock);
  const rootHandle = await getRootHandle();
  const { clientState } = await getParsedFileContents<PersistedClient>(rootHandle, serverMock.slug);
  hydrate(queryClient, clientState);
});

// TODO: Write these tests

describe('Server initialization', () => {
  describe('Map', () => {
    test('There should be exactly (size * sqrt(2) + borderWidth + 1) ** 2 tiles', () => {
      const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
      const borderWidth = 4;
      const totalSize = Math.ceil(serverMock.configuration.mapSize * Math.sqrt(2)) + borderWidth;
      const totalTiles = (totalSize + 1) ** 2;
      expect(tiles.length).toBe(totalTiles);
    });

    test("Each tile should have a type and each tile's type should either be free-tile or oasis-tile", () => {
      const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
      expect(tiles.every((tile) => Object.hasOwn(tile, 'type') && ['free-tile', 'oasis-tile'].includes(tile.type))).toBe(true);
    });

    test("Each tile's coordinates should be between [-size/2, size/2]", () => {
      const borderWidth = 4;
      const totalSize = Math.ceil(serverMock.configuration.mapSize * Math.sqrt(2)) + borderWidth;
      const limit = totalSize / 2;
      const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
      expect(
        tiles.every(({ id }) => {
          const { x, y } = parseCoordinatesFromTileId(id);
          return x >= -limit && x <= limit && y >= -limit && y <= limit;
        }),
      ).toBe(true);
    });

    test('Some oasis tile should have no bonus', () => {
      const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
      const oasisTiles = tiles.filter(isOasisTile);
      expect(oasisTiles.some(({ ORB }) => ORB.length === 0)).toBe(true);
    });

    test('Some oasis tile should have only 25% single-resource bonus', () => {
      const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
      const oasisTiles = tiles.filter(isOasisTile);

      expect(
        oasisTiles.some(({ ORB }) => {
          if (ORB.length !== 1) {
            return false;
          }
          const { bonus } = ORB[0];
          return bonus === '25%';
        }),
      ).toBe(true);
    });

    test('Some oasis tile should have 50% single-resource bonus', () => {
      const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
      const oasisTiles = tiles.filter(isOasisTile);

      expect(
        oasisTiles.some(({ ORB }) => {
          if (ORB.length !== 1) {
            return false;
          }
          const { bonus } = ORB[0];
          return bonus === '50%';
        }),
      ).toBe(true);
    });

    test('Some oasis tile should have double 25% single-resource bonus', () => {
      const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
      const oasisTiles = tiles.filter(isOasisTile);

      expect(
        oasisTiles.some(({ ORB }) => {
          if (ORB.length !== 2) {
            return false;
          }
          const [firstBonus, secondBonus] = ORB;
          return firstBonus.bonus === '25%' && secondBonus.bonus === '25%';
        }),
      ).toBe(true);
    });

    test('Some oasis should be occupied by npc players', () => {
      const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
      const occupiedOasisTiles = tiles.filter(isOccupiedOasisTile);

      expect(occupiedOasisTiles.length > 0).toBe(true);
    });

    test('No oasis should be occupied by villages of size "xs"', () => {
      const server = queryClient.getQueryData<Server>([serverCacheKey])!;
      const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
      const occupiedOasisTiles = tiles.filter(isOccupiedOasisTile);
      const occupiedOccupiableTiles = tiles.filter(isOccupiedOccupiableTile);

      const extraSmallVillageTileIds = occupiedOccupiableTiles
        .filter(({ id }) => getVillageSize(server.configuration.mapSize, id) === 'sm')
        .map(({ id }) => id);
      const occupiedOasisVillageIds = occupiedOasisTiles.map(({ villageId }) => villageId);

      const listOfOccurrences = extraSmallVillageTileIds.map((id) => occupiedOasisVillageIds.filter((villageId) => villageId === id));
      expect(listOfOccurrences.every((occurrence) => occurrence.length === 0)).toBe(true);
    });

    // We're counting how many times occupying tile id appears in list of occupied oasis ids
    test('No oasis should be occupied by villages of size "sm"', () => {
      const server = queryClient.getQueryData<Server>([serverCacheKey])!;
      const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
      const occupiedOasisTiles = tiles.filter(isOccupiedOasisTile);
      const occupiedOccupiableTiles = tiles.filter(isOccupiedOccupiableTile);

      const smallVillageTileIds = occupiedOccupiableTiles
        .filter(({ id }) => getVillageSize(server.configuration.mapSize, id) === 'sm')
        .map(({ id }) => id);
      const occupiedOasisVillageIds = occupiedOasisTiles.map(({ villageId }) => villageId);

      const listOfOccurrences = smallVillageTileIds.map((id) => occupiedOasisVillageIds.filter((villageId) => villageId === id));
      expect(listOfOccurrences.every((occurrence) => occurrence.length <= 1)).toBe(true);
    });

    test('No more than 2 oasis per village should be occupied by villages of size "md"', () => {
      const server = queryClient.getQueryData<Server>([serverCacheKey])!;
      const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
      const occupiedOasisTiles = tiles.filter(isOccupiedOasisTile);
      const occupiedOccupiableTiles = tiles.filter(isOccupiedOccupiableTile);

      const mediumVillageTileIds = occupiedOccupiableTiles
        .filter(({ id }) => getVillageSize(server.configuration.mapSize, id) === 'md')
        .map(({ id }) => id);
      const occupiedOasisVillageIds = occupiedOasisTiles.map(({ villageId }) => villageId);

      const listOfOccurrences = mediumVillageTileIds.map((id) => occupiedOasisVillageIds.filter((villageId) => villageId === id));
      expect(listOfOccurrences.every((occurrence) => occurrence.length <= 2)).toBe(true);
    });

    test('No more than 3 oasis per village should be occupied by villages of size "lg"', () => {
      const server = queryClient.getQueryData<Server>([serverCacheKey])!;
      const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
      const occupiedOasisTiles = tiles.filter(isOccupiedOasisTile);
      const occupiedOccupiableTiles = tiles.filter(isOccupiedOccupiableTile);

      const largeVillageTileIds = occupiedOccupiableTiles
        .filter(({ id }) => getVillageSize(server.configuration.mapSize, id) === 'md')
        .map(({ id }) => id);
      const occupiedOasisVillageIds = occupiedOasisTiles.map(({ villageId }) => villageId);

      const listOfOccurrences = largeVillageTileIds.map((id) => occupiedOasisVillageIds.filter((villageId) => villageId === id));
      expect(listOfOccurrences.every((occurrence) => occurrence.length <= 3)).toBe(true);
    });

    test('Same seed should generate same map every time', () => {
      const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;

      // Doesn't really matter which 2 we pick, since the chance of these 2 being the same and seeding not working is basically 0
      const tile1 = tiles.find(({ id }) => {
        const { x, y } = parseCoordinatesFromTileId(id);
        return x === -2 && y === 0;
      })! as OccupiedOasisTile;
      const tile2 = tiles.find(({ id }) => {
        const { x, y } = parseCoordinatesFromTileId(id);
        return x === -1 && y === 0;
      })! as OccupiedOasisTile;

      const { oasisResource: tile1OasisResource } = decodeGraphicsProperty(tile1.graphics);
      const { oasisResource: tile2OasisResource } = decodeGraphicsProperty(tile2.graphics);

      expect(tile1OasisResource === 'iron' && tile1.ORB[0].bonus === '25%').toBe(true);
      expect(tile2OasisResource === 'iron' && tile2.ORB[0].bonus === '25%').toBe(true);
    });

    test('Border tiles should be generated on all sides', () => {
      const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;

      const borderWidth = 4;
      const totalSize = Math.ceil(serverMock.configuration.mapSize * Math.sqrt(2)) + borderWidth;
      const limit = totalSize / 2;

      const borderTiles = tiles.filter(({ id }) => {
        const { x, y } = parseCoordinatesFromTileId(id);
        return Math.sqrt(x ** 2 + y ** 2) >= limit - borderWidth / 2;
      });

      const areAllBorderTilesOasis = borderTiles.every((tile) => tile.type === 'oasis-tile');

      expect(areAllBorderTilesOasis).toBe(true);
    });
  });

  describe('Villages', () => {
    test.todo('', () => {
      const _villages = queryClient.getQueryData<Village[]>([villagesCacheKey])!;
    });
  });

  describe('Troops', () => {
    test('Each troop should have correct server id', () => {
      const _troops = queryClient.getQueryData<Troop[]>([troopsCacheKey])!;
    });
  });

  describe('Quests', () => {
    test.todo('', () => {
      const _quests = queryClient.getQueryData<Quest[]>([questsCacheKey])!;
    });
  });

  describe('Effects', () => {
    test.todo('', () => {
      const _effects = queryClient.getQueryData<Effect[]>([effectsCacheKey])!;
    });
  });

  describe('Events', () => {
    test.todo('', () => {
      const _events = queryClient.getQueryData<GameEvent[]>([eventsCacheKey])!;
    });
  });

  describe('Unit research', () => {
    test.todo('', () => {
      const _unitResearch = queryClient.getQueryData<UnitResearch[]>([unitResearchCacheKey])!;
    });
  });
});
