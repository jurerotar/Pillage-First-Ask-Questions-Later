import type { ApiHandler } from 'app/interfaces/api';
import {
  mapCacheKey,
  playersCacheKey,
  troopsCacheKey,
  villagesCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import type { Player } from 'app/interfaces/models/game/player';
import type { Village } from 'app/interfaces/models/game/village';
import type { Troop } from 'app/interfaces/models/game/troop';
import type { Tile } from 'app/interfaces/models/game/tile';

export const getPlayers: ApiHandler<Player[]> = async (queryClient) => {
  return queryClient.getQueryData<Player[]>([playersCacheKey])!;
};

export const getPlayerById: ApiHandler<Player, 'playerId'> = async (
  queryClient,
  _database,
  args,
) => {
  const {
    params: { playerId },
  } = args;

  const players = queryClient.getQueryData<Player[]>([playersCacheKey])!;

  return players.find(({ id }) => id === playerId)!;
};

export const getVillagesByPlayer: ApiHandler<Village[], 'playerId'> = async (
  queryClient,
  _database,
  args,
) => {
  const {
    params: { playerId },
  } = args;

  const villages = queryClient.getQueryData<Village[]>([villagesCacheKey])!;

  return villages.filter(({ playerId: ownedBy }) => ownedBy === playerId)!;
};

export const getTroopsByVillage: ApiHandler<
  Troop[],
  'playerId' | 'villageId'
> = async (queryClient, _database, args) => {
  const {
    params: { villageId },
  } = args;

  const tiles = queryClient.getQueryData<Tile[]>([mapCacheKey])!;
  const villages = queryClient.getQueryData<Village[]>([villagesCacheKey])!;
  const village = villages.find(({ id }) => id === villageId)!;

  const { id } = tiles.find(
    ({ coordinates }) =>
      coordinates.x === village.coordinates.x &&
      coordinates.y === village.coordinates.y,
  )!;

  const troops = queryClient.getQueryData<Troop[]>([troopsCacheKey]) ?? [];
  return troops.filter(({ tileId }) => tileId === id);
};

type RenameVillageBody = {
  name: string;
};

export const renameVillage: ApiHandler<
  void,
  'playerId' | 'villageId',
  RenameVillageBody
> = async (queryClient, _database, args) => {
  const {
    params: { villageId },
    body: { name },
  } = args;

  const villages = queryClient.getQueryData<Village[]>([villagesCacheKey])!;

  const villageToRename = villages.find(({ id }) => id === villageId)!;

  villageToRename.name = name;

  queryClient.setQueryData([villagesCacheKey], () => {
    return villages;
  });
};
