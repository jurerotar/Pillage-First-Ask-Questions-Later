import type { ApiHandler } from 'app/interfaces/api';
import {
  eventsCacheKey,
  playersCacheKey,
  playerTroopsCacheKey,
  playerVillagesCacheKey,
  troopsCacheKey,
  villagesCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import type { Player } from 'app/interfaces/models/game/player';
import type { PlayerVillage } from 'app/interfaces/models/game/village';
import type { Troop } from 'app/interfaces/models/game/troop';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { isTroopMovementEvent } from 'app/(game)/guards/event-guards';

export const getPlayers: ApiHandler<Player[]> = async (queryClient) => {
  return queryClient.getQueryData<Player[]>([playersCacheKey])!;
};

export const getPlayerById: ApiHandler<Player, 'playerId'> = async (queryClient, args) => {
  const {
    params: { playerId },
  } = args;
  const players = queryClient.getQueryData<Player[]>([playersCacheKey])!;

  return players.find(({ id }) => id === playerId)!;
};

export const getVillagesByPlayer: ApiHandler<PlayerVillage[], 'playerId'> = async (queryClient, args) => {
  const {
    params: { playerId },
  } = args;

  if (playerId === 'player') {
    const villages = queryClient.getQueryData<PlayerVillage[]>([playerVillagesCacheKey])!;
    return villages;
  }

  const villages = queryClient.getQueryData<PlayerVillage[]>([villagesCacheKey])!;

  return villages.filter(({ playerId: ownedBy }) => ownedBy === playerId)!;
};

export const getTroopsByVillage: ApiHandler<Troop[], 'playerId' | 'villageId'> = async (queryClient, args) => {
  const {
    params: { playerId, villageId: villageIdParam },
  } = args;

  const villageId = Number.parseInt(villageIdParam);

  if (playerId === 'player') {
    const playerTroops = queryClient.getQueryData<Troop[]>([playerTroopsCacheKey]) ?? [];
    return playerTroops.filter(({ tileId }) => tileId === villageId);
  }

  const troops = queryClient.getQueryData<Troop[]>([troopsCacheKey]) ?? [];
  return troops.filter(({ tileId }) => tileId === villageId);
};

export const getTroopMovementsByVillage: ApiHandler<GameEvent<'troopMovement'>[], 'playerId' | 'villageId'> = async (queryClient, args) => {
  const {
    params: { villageId: villageIdParam },
  } = args;

  const villageId = Number.parseInt(villageIdParam);

  const events = queryClient.getQueryData<GameEvent<'troopMovement'>[]>([eventsCacheKey]) ?? [];
  const troopMovementEvents = events.filter(isTroopMovementEvent);
  const villageTroopMovementEvents = troopMovementEvents.filter(({ villageId: sourceVillageId, targetId }) => {
    return sourceVillageId === villageId || targetId === villageId;
  });

  return villageTroopMovementEvents;
};

type RenameVillageBody = {
  name: string;
};

export const renameVillage: ApiHandler<void, 'playerId' | 'villageId', RenameVillageBody> = async (queryClient, args) => {
  const {
    params: { villageId: villageIdParam },
    body: { name },
  } = args;

  const villageId = Number.parseInt(villageIdParam);

  const playerVillages = await getVillagesByPlayer(queryClient, args);
  const villageToRename = playerVillages.find(({ id }) => id === villageId)!;

  villageToRename.name = name;

  queryClient.setQueryData([playerVillagesCacheKey], () => {
    return playerVillages;
  });
};
