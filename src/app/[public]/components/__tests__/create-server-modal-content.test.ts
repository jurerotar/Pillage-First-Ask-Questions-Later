import { isOasisTile, isOccupiedOasisTile, isOccupiedOccupiableTile } from 'app/[game]/utils/guards/map-guards';
import { initializeServer } from 'app/[public]/components/create-server-modal-content';
import type { OccupiedOasisTile, Tile } from 'interfaces/models/game/tile';
import { serverMock } from 'mocks/game/server-mock';
import { beforeAll, describe, expect, test } from 'vitest';
import 'packages/vitest-opfs-mock';
import { QueryClient, hydrate } from '@tanstack/react-query';
import type { PersistedClient } from '@tanstack/react-query-persist-client';
import { achievementsCacheKey } from 'app/[game]/hooks/use-achievements';
import { effectsCacheKey } from 'app/[game]/hooks/use-effects';
import { eventsCacheKey } from 'app/[game]/hooks/use-events';
import { mapCacheKey } from 'app/[game]/hooks/use-map';
import { playersCacheKey } from 'app/[game]/hooks/use-players';
import { questsCacheKey } from 'app/[game]/hooks/use-quests';
import { reputationsCacheKey } from 'app/[game]/hooks/use-reputations';
import { troopsCacheKey } from 'app/[game]/hooks/use-troops';
import { villagesCacheKey } from 'app/[game]/hooks/use-villages';
import { getParsedFileContents, getRootHandle } from 'app/utils/opfs';
import type { GameEvent } from 'interfaces/models/events/game-event';
import type { Achievement } from 'interfaces/models/game/achievement';
import type { Effect } from 'interfaces/models/game/effect';
import type { Player } from 'interfaces/models/game/player';
import type { Quest } from 'interfaces/models/game/quest';
import type { Reputation } from 'interfaces/models/game/reputation';
import type { Troop } from 'interfaces/models/game/troop';
import type { Village } from 'interfaces/models/game/village';

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
    test('There should be 9 factions', async () => {
      const reputations = queryClient.getQueryData<Reputation[]>([reputationsCacheKey])!;
      expect(reputations.length).toBe(9);
    });
  });

  describe('Players', () => {
    test('There should be 51 players', async () => {
      const players = queryClient.getQueryData<Player[]>([playersCacheKey])!;
      expect(players.length).toBe(51);
    });
  });

  describe('Map', () => {
    test('There should be exactly (size + 1)**2 tiles', async () => {
      const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
      expect(tiles.length).toBe((serverMock.configuration.mapSize + 1) ** 2);
    });

    test("Each tile should have a type and each tile's type should either be free-tile or oasis-tile", async () => {
      const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
      expect(tiles.every((tile) => Object.hasOwn(tile, 'type') && ['free-tile', 'oasis-tile'].includes(tile.type))).toBe(true);
    });

    test("Each tile's coordinates should be between [-size/2, size/2]", async () => {
      const limit = serverMock.configuration.mapSize / 2;
      const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
      expect(tiles.every(({ coordinates: { x, y } }) => x >= -limit && x <= limit && y >= -limit && y <= limit)).toBe(true);
    });

    test('Some oasis tile should have no bonus', async () => {
      const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
      const oasisTiles = tiles.filter(isOasisTile);
      expect(oasisTiles.some(({ oasisResourceBonus }) => oasisResourceBonus.length === 0)).toBe(true);
    });

    test('Some oasis tile should have only 25% single-resource bonus', async () => {
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

    test('Some oasis tile should have 50% single-resource bonus', async () => {
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

    test('Some oasis tile should have double 25% single-resource bonus', async () => {
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

    test('Some oasis should be occupied by npc players', async () => {
      const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
      const occupiedOasisTiles = tiles.filter(isOccupiedOasisTile);

      expect(occupiedOasisTiles.length > 0).toBe(true);
    });

    test('No oasis should be occupied by villages of size "xs"', async () => {
      const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
      const occupiedOasisTiles = tiles.filter(isOccupiedOasisTile);
      const occupiedOccupiableTiles = tiles.filter(isOccupiedOccupiableTile);

      const extraSmallVillageTileIds = occupiedOccupiableTiles.filter(({ villageSize }) => villageSize === 'xs').map(({ id }) => id);
      const occupiedOasisVillageIds = occupiedOasisTiles.map(({ villageId }) => villageId);

      const listOfOccurrences = extraSmallVillageTileIds.map((id) => occupiedOasisVillageIds.filter((villageId) => villageId === id));
      expect(listOfOccurrences.every((occurrence) => occurrence.length === 0)).toBe(true);
    });

    // We're counting how many times occupying tile id appears in list of occupied oasis ids
    test('No more than 1 oasis per village should be occupied by villages of size "sm"', async () => {
      const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
      const occupiedOasisTiles = tiles.filter(isOccupiedOasisTile);
      const occupiedOccupiableTiles = tiles.filter(isOccupiedOccupiableTile);

      const smallVillageTileIds = occupiedOccupiableTiles.filter(({ villageSize }) => villageSize === 'sm').map(({ id }) => id);
      const occupiedOasisVillageIds = occupiedOasisTiles.map(({ villageId }) => villageId);

      const listOfOccurrences = smallVillageTileIds.map((id) => occupiedOasisVillageIds.filter((villageId) => villageId === id));
      expect(listOfOccurrences.every((occurrence) => occurrence.length <= 1)).toBe(true);
    });

    test('No more than 2 oasis per village should be occupied by villages of size "md"', async () => {
      const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
      const occupiedOasisTiles = tiles.filter(isOccupiedOasisTile);
      const occupiedOccupiableTiles = tiles.filter(isOccupiedOccupiableTile);

      const mediumVillageTileIds = occupiedOccupiableTiles.filter(({ villageSize }) => villageSize === 'md').map(({ id }) => id);
      const occupiedOasisVillageIds = occupiedOasisTiles.map(({ villageId }) => villageId);

      const listOfOccurrences = mediumVillageTileIds.map((id) => occupiedOasisVillageIds.filter((villageId) => villageId === id));
      expect(listOfOccurrences.every((occurrence) => occurrence.length <= 2)).toBe(true);
    });

    test('No more than 3 oasis per village should be occupied by villages of size "lg"', async () => {
      const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
      const occupiedOasisTiles = tiles.filter(isOccupiedOasisTile);
      const occupiedOccupiableTiles = tiles.filter(isOccupiedOccupiableTile);

      const largeVillageTileIds = occupiedOccupiableTiles.filter(({ villageSize }) => villageSize === 'md').map(({ id }) => id);
      const occupiedOasisVillageIds = occupiedOasisTiles.map(({ villageId }) => villageId);

      const listOfOccurrences = largeVillageTileIds.map((id) => occupiedOasisVillageIds.filter((villageId) => villageId === id));
      expect(listOfOccurrences.every((occurrence) => occurrence.length <= 3)).toBe(true);
    });

    test('Same seed should generate same map every time', async () => {
      const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;

      // Doesn't really matter which 3 we pick, since the chance of these 3 being the same and seeding not working is basically 0
      const tile1 = tiles.find(({ coordinates: { x, y } }) => x === -48 && y === 49)! as OccupiedOasisTile;
      const tile2 = tiles.find(({ coordinates: { x, y } }) => x === -40 && y === 47)! as OccupiedOasisTile;
      const tile3 = tiles.find(({ coordinates: { x, y } }) => x === -40 && y === 46)! as OccupiedOasisTile;

      expect(tile1.graphics.oasisResource === 'clay' && tile1.oasisResourceBonus[0].bonus === '25%').toBe(true);
      expect(tile2.graphics.oasisResource === 'wood' && tile2.oasisResourceBonus[0].bonus === '25%').toBe(true);
      expect(
        tile3.graphics.oasisResource === 'wood' &&
          tile3.oasisResourceBonus[0].bonus === '25%' &&
          tile3.oasisResourceBonus[1].bonus === '25%',
      ).toBe(true);
    });
  });

  describe('Villages', () => {
    test.todo('', async () => {
      const _villages = queryClient.getQueryData<Village[]>([villagesCacheKey])!;
    });
  });

  describe('Troops', () => {
    test('Each troop should have correct server id', async () => {
      const _troops = queryClient.getQueryData<Troop[]>([troopsCacheKey])!;
    });
  });

  describe('Quests', () => {
    test.todo('', async () => {
      const _quests = queryClient.getQueryData<Quest[]>([questsCacheKey])!;
    });
  });

  describe('Achievements', () => {
    test.todo('', async () => {
      const _achievements = queryClient.getQueryData<Achievement[]>([achievementsCacheKey])!;
    });
  });

  describe('Effects', () => {
    test.todo('', async () => {
      const _effects = queryClient.getQueryData<Effect[]>([effectsCacheKey])!;
    });
  });

  describe('Events', () => {
    test.todo('', async () => {
      const _events = queryClient.getQueryData<GameEvent[]>([eventsCacheKey])!;
    });
  });
});
