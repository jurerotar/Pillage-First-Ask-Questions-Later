import { isOasisTile, isOccupiedOasisTile, isOccupiedOccupiableTile } from 'app/(game)/utils/guards/map-guards';
import { initializeServer } from 'app/(public)/components/create-server-modal-content';
import type { OccupiedOasisTile, Tile } from 'app/interfaces/models/game/tile';
import { serverMock } from 'app/tests/mocks/game/server-mock';
import { beforeAll, describe, expect, test } from 'vitest';
import 'opfs-mock';
import '@vitest/web-worker';
import { hydrate, QueryClient } from '@tanstack/react-query';
import type { PersistedClient } from '@tanstack/react-query-persist-client';
import {
  achievementsCacheKey,
  currentServerCacheKey,
  effectsCacheKey,
  eventsCacheKey,
  mapCacheKey,
  playersCacheKey,
  questsCacheKey,
  reputationsCacheKey,
  troopsCacheKey,
  unitResearchCacheKey,
  villagesCacheKey,
} from 'app/query-keys';
import { getVillageSize } from 'app/factories/utils/common';
import type { GameEvent } from 'app/interfaces/models/events/game-event';
import type { Achievement } from 'app/interfaces/models/game/achievement';
import type { Effect } from 'app/interfaces/models/game/effect';
import type { Player } from 'app/interfaces/models/game/player';
import type { Quest } from 'app/interfaces/models/game/quest';
import type { Reputation } from 'app/interfaces/models/game/reputation';
import type { Server } from 'app/interfaces/models/game/server';
import type { Troop } from 'app/interfaces/models/game/troop';
import type { UnitResearch } from 'app/interfaces/models/game/unit-research';
import type { Village } from 'app/interfaces/models/game/village';
import { getParsedFileContents, getRootHandle } from 'app/utils/opfs';

const queryClient = new QueryClient();

beforeAll(async () => {
  await initializeServer({ server: serverMock });
  const rootHandle = await getRootHandle();
  const { clientState } = await getParsedFileContents<PersistedClient>(rootHandle, serverMock.slug);
  hydrate(queryClient, clientState);
});

// TODO: Write these tests

describe('Server initialization', () => {
  describe('Factions', () => {
    test('There should be 9 factions', () => {
      const reputations = queryClient.getQueryData<Reputation[]>([reputationsCacheKey])!;
      expect(reputations.length).toBe(9);
    });
  });

  describe('Players', () => {
    test('There should be 51 players', () => {
      const players = queryClient.getQueryData<Player[]>([playersCacheKey])!;
      expect(players.length).toBe(51);
    });
  });

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
      expect(tiles.every(({ coordinates: { x, y } }) => x >= -limit && x <= limit && y >= -limit && y <= limit)).toBe(true);
    });

    test('Some oasis tile should have no bonus', () => {
      const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
      const oasisTiles = tiles.filter(isOasisTile);
      expect(oasisTiles.some(({ oasisResourceBonus }) => oasisResourceBonus.length === 0)).toBe(true);
    });

    test('Some oasis tile should have only 25% single-resource bonus', () => {
      const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
      const oasisTiles = tiles.filter(isOasisTile);

      expect(
        oasisTiles.some(({ oasisResourceBonus }) => {
          if (oasisResourceBonus.length !== 1) {
            return false;
          }
          const { bonus } = oasisResourceBonus[0];
          return bonus === '25%';
        }),
      ).toBe(true);
    });

    test('Some oasis tile should have 50% single-resource bonus', () => {
      const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
      const oasisTiles = tiles.filter(isOasisTile);

      expect(
        oasisTiles.some(({ oasisResourceBonus }) => {
          if (oasisResourceBonus.length !== 1) {
            return false;
          }
          const { bonus } = oasisResourceBonus[0];
          return bonus === '50%';
        }),
      ).toBe(true);
    });

    test('Some oasis tile should have double 25% single-resource bonus', () => {
      const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
      const oasisTiles = tiles.filter(isOasisTile);

      expect(
        oasisTiles.some(({ oasisResourceBonus }) => {
          if (oasisResourceBonus.length !== 2) {
            return false;
          }
          const [firstBonus, secondBonus] = oasisResourceBonus;
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
      const server = queryClient.getQueryData<Server>([currentServerCacheKey])!;
      const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
      const occupiedOasisTiles = tiles.filter(isOccupiedOasisTile);
      const occupiedOccupiableTiles = tiles.filter(isOccupiedOccupiableTile);

      const extraSmallVillageTileIds = occupiedOccupiableTiles
        .filter(({ coordinates }) => getVillageSize(server.configuration.mapSize, coordinates) === 'sm')
        .map(({ id }) => id);
      const occupiedOasisVillageIds = occupiedOasisTiles.map(({ villageId }) => villageId);

      const listOfOccurrences = extraSmallVillageTileIds.map((id) => occupiedOasisVillageIds.filter((villageId) => villageId === id));
      expect(listOfOccurrences.every((occurrence) => occurrence.length === 0)).toBe(true);
    });

    // We're counting how many times occupying tile id appears in list of occupied oasis ids
    test('No oasis should be occupied by villages of size "sm"', () => {
      const server = queryClient.getQueryData<Server>([currentServerCacheKey])!;
      const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
      const occupiedOasisTiles = tiles.filter(isOccupiedOasisTile);
      const occupiedOccupiableTiles = tiles.filter(isOccupiedOccupiableTile);

      const smallVillageTileIds = occupiedOccupiableTiles
        .filter(({ coordinates }) => getVillageSize(server.configuration.mapSize, coordinates) === 'sm')
        .map(({ id }) => id);
      const occupiedOasisVillageIds = occupiedOasisTiles.map(({ villageId }) => villageId);

      const listOfOccurrences = smallVillageTileIds.map((id) => occupiedOasisVillageIds.filter((villageId) => villageId === id));
      expect(listOfOccurrences.every((occurrence) => occurrence.length <= 1)).toBe(true);
    });

    test('No more than 2 oasis per village should be occupied by villages of size "md"', () => {
      const server = queryClient.getQueryData<Server>([currentServerCacheKey])!;
      const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
      const occupiedOasisTiles = tiles.filter(isOccupiedOasisTile);
      const occupiedOccupiableTiles = tiles.filter(isOccupiedOccupiableTile);

      const mediumVillageTileIds = occupiedOccupiableTiles
        .filter(({ coordinates }) => getVillageSize(server.configuration.mapSize, coordinates) === 'md')
        .map(({ id }) => id);
      const occupiedOasisVillageIds = occupiedOasisTiles.map(({ villageId }) => villageId);

      const listOfOccurrences = mediumVillageTileIds.map((id) => occupiedOasisVillageIds.filter((villageId) => villageId === id));
      expect(listOfOccurrences.every((occurrence) => occurrence.length <= 2)).toBe(true);
    });

    test('No more than 3 oasis per village should be occupied by villages of size "lg"', () => {
      const server = queryClient.getQueryData<Server>([currentServerCacheKey])!;
      const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
      const occupiedOasisTiles = tiles.filter(isOccupiedOasisTile);
      const occupiedOccupiableTiles = tiles.filter(isOccupiedOccupiableTile);

      const largeVillageTileIds = occupiedOccupiableTiles
        .filter(({ coordinates }) => getVillageSize(server.configuration.mapSize, coordinates) === 'md')
        .map(({ id }) => id);
      const occupiedOasisVillageIds = occupiedOasisTiles.map(({ villageId }) => villageId);

      const listOfOccurrences = largeVillageTileIds.map((id) => occupiedOasisVillageIds.filter((villageId) => villageId === id));
      expect(listOfOccurrences.every((occurrence) => occurrence.length <= 3)).toBe(true);
    });

    test('Same seed should generate same map every time', () => {
      const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;

      // Doesn't really matter which 2 we pick, since the chance of these 2 being the same and seeding not working is basically 0
      const tile1 = tiles.find(({ coordinates: { x, y } }) => x === 2 && y === 3)! as OccupiedOasisTile;
      const tile2 = tiles.find(({ coordinates: { x, y } }) => x === 6 && y === 2)! as OccupiedOasisTile;

      expect(tile1.graphics.oasisResource === 'wheat' && tile1.oasisResourceBonus[0].bonus === '25%').toBe(true);
      expect(tile2.graphics.oasisResource === 'wood' && tile2.oasisResourceBonus[0].bonus === '25%').toBe(true);
    });

    test('Border tiles should be generated on all sides', () => {
      const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;

      const borderWidth = 4;
      const totalSize = Math.ceil(serverMock.configuration.mapSize * Math.sqrt(2)) + borderWidth;
      const limit = totalSize / 2;

      const borderTiles = tiles.filter(({ coordinates: { x, y } }) => {
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

  describe('Achievements', () => {
    test.todo('', () => {
      const _achievements = queryClient.getQueryData<Achievement[]>([achievementsCacheKey])!;
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
