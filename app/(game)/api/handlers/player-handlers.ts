import type { ApiHandler } from 'app/interfaces/api';
import {
  playersCacheKey,
  troopsCacheKey,
  villagesCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import type { Player } from 'app/interfaces/models/game/player';
import type { Village } from 'app/interfaces/models/game/village';
import type { Troop } from 'app/interfaces/models/game/troop';

export const getPlayers: ApiHandler<Player[]> = async (queryClient) => {
  return queryClient.getQueryData<Player[]>([playersCacheKey])!;
};

export const getPlayerById: ApiHandler<Player, 'playerId'> = async (
  queryClient,
  _database,
  args,
) => {
  const {
    params: { playerId: playerIdParam },
  } = args;

  const playerId = Number.parseInt(playerIdParam);

  const players = queryClient.getQueryData<Player[]>([playersCacheKey])!;

  return players.find(({ id }) => id === playerId)!;
};

export const getVillagesByPlayer: ApiHandler<Village[], 'playerId'> = async (
  queryClient,
  _database,
  args,
) => {
  const {
    params: { playerId: playerIdParam },
  } = args;

  const playerId = Number.parseInt(playerIdParam);

  const villages = queryClient.getQueryData<Village[]>([villagesCacheKey])!;

  return villages.filter(({ playerId: ownedBy }) => ownedBy === playerId)!;
};

export const getTroopsByVillage: ApiHandler<
  Troop[],
  'playerId' | 'villageId'
> = async (queryClient, _database, args) => {
  const {
    params: { villageId: villageIdParam },
  } = args;

  const villageId = Number.parseInt(villageIdParam);

  const troops = queryClient.getQueryData<Troop[]>([troopsCacheKey]) ?? [];
  return troops.filter(({ tileId }) => tileId === villageId);
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
    params: { villageId: villageIdParam },
    body: { name },
  } = args;

  const villageId = Number.parseInt(villageIdParam);

  const villages = queryClient.getQueryData<Village[]>([villagesCacheKey])!;

  const villageToRename = villages.find(({ id }) => id === villageId)!;

  villageToRename.name = name;

  queryClient.setQueryData([villagesCacheKey], () => {
    return villages;
  });
};
