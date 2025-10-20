import type { ApiHandler } from 'app/interfaces/api';
import type { ContextualTile, Tile } from 'app/interfaces/models/game/tile';
import {
  eventsCacheKey,
  mapCacheKey,
  playersCacheKey,
  reputationsCacheKey,
  troopsCacheKey,
  villagesCacheKey,
  artifactsInVicinityCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import type { Reputation } from 'app/interfaces/models/game/reputation';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import type { Player } from 'app/interfaces/models/game/player';
import type { Village } from 'app/interfaces/models/game/village';
import type { WorldItem } from 'app/interfaces/models/game/world-item';
import {
  isOccupiedOasisTile,
  isOccupiedOccupiableTile,
} from 'app/(game)/(village-slug)/utils/guards/map-guards';
import { isTroopMovementEvent } from 'app/(game)/guards/event-guards';
import type { Troop } from 'app/interfaces/models/game/troop';

type GetTilePlayerReturn = {
  player: Player;
  reputation: Reputation;
  village: Village;
  population: number;
};

export const getTilePlayer: ApiHandler<GetTilePlayerReturn, 'tileId'> = (
  _database,
  { params },
) => {
  const { tileId } = params;

  const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
  const villages = queryClient.getQueryData<Village[]>([villagesCacheKey])!;
  const players = queryClient.getQueryData<Player[]>([playersCacheKey])!;
  const reputations = queryClient.getQueryData<Reputation[]>([
    reputationsCacheKey,
  ])!;

  const tile = tiles.find((tile) => tile.id === tileId)!;

  const village = (() => {
    if (isOccupiedOasisTile(tile)) {
      const owningTile = tiles.find((t) => t.id === tile.villageId)!;
      return villages.find(
        ({ coordinates }) =>
          owningTile.coordinates.x === coordinates.x &&
          owningTile.coordinates.y === coordinates.y,
      )!;
    }

    return villages.find(
      ({ coordinates }) =>
        tile.coordinates.x === coordinates.x &&
        tile.coordinates.y === coordinates.y,
    )!;
  })();

  const player = players.find((player) => village.playerId === player.id)!;
  const reputation = reputations.find(
    (reputation) => reputation.faction === player.faction,
  )!;

  return {
    player,
    reputation,
    village,
    population,
  };
};

export const getTileTroops: ApiHandler<Troop[], 'tileId'> = (
  _database,
  { params },
) => {
  const { tileId } = params;

  const troops = queryClient.getQueryData<Troop[]>([troopsCacheKey])!;

  return troops.filter((troop) => troop.tileId === tileId);
};

export const getTileWorldItem: ApiHandler<WorldItem | null, 'tileId'> = (
  _database,
  { params },
) => {
  const { tileId } = params;

  const worldItems = queryClient.getQueryData<WorldItem[]>([
    artifactsInVicinityCacheKey,
  ])!;

  return worldItems.find((worldItem) => worldItem.tileId === tileId) ?? null;
};

export const getContextualMap: ApiHandler<ContextualTile[], 'villageId'> = (
  _database,
  { params },
) => {
  const { villageId } = params;

  const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
  const reputations = queryClient.getQueryData<Reputation[]>([
    reputationsCacheKey,
  ])!;
  const events = queryClient.getQueryData<GameEvent[]>([eventsCacheKey])!;
  const players = queryClient.getQueryData<Player[]>([playersCacheKey])!;
  const _villages = queryClient.getQueryData<Village[]>([villagesCacheKey])!;
  const worldItems = queryClient.getQueryData<WorldItem[]>([
    artifactsInVicinityCacheKey,
  ])!;

  const reputationMap = new Map<Player['faction'], Reputation>(
    reputations.map((reputation) => {
      return [reputation.faction, reputation];
    }),
  );

  const playerMap = new Map<Player['id'], Player>(
    players.map((player) => {
      return [player.id, player];
    }),
  );

  const worldItemsMap = new Map<Village['id'], WorldItem>(
    worldItems.map((worldItem) => {
      return [worldItem.tileId, worldItem];
    }),
  );

  const troopMovementMap = new Map<Village['id'], GameEvent<'troopMovement'>[]>(
    [],
  );

  for (const event of events) {
    if (!isTroopMovementEvent(event)) {
      continue;
    }

    // Show only events targeting or originating from current village
    if (!(event.villageId === villageId || event.targetId === villageId)) {
      continue;
    }

    if (!troopMovementMap.has(event.targetId)) {
      troopMovementMap.set(event.targetId, []);
    }

    const eventArray = troopMovementMap.get(event.targetId)!;
    eventArray.push(event);
  }

  const contextualTiles: ContextualTile[] = Array(tiles.length);

  for (let i = 0; i < tiles.length; i += 1) {
    const tile = tiles[i] as ContextualTile;

    if (isOccupiedOccupiableTile(tile)) {
      const { faction, tribe } = playerMap.get(tile.ownedBy)!;

      // TODO: Calculate village size
      tile.villageSize = 'xs';
      tile.tribe = tribe;
      tile.worldItem = worldItemsMap.get(tile.id) ?? null;
      tile.reputationLevel = reputationMap.get(faction)!.reputationLevel;
    }

    contextualTiles[i] = tile;
  }

  return contextualTiles;
};
