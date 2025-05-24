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
import type { PlayerVillage, Village } from 'app/interfaces/models/game/village';
import type { Troop } from 'app/interfaces/models/game/troop';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { isTroopMovementEvent } from 'app/(game)/(village-slug)/hooks/guards/event-guards';

export const getPlayers: ApiHandler<Player[]> = async (queryClient) => {
  return queryClient.getQueryData<Player[]>([playersCacheKey])!;
};

type GetPlayerByIdParams = {
  playerId: Player['id'];
};

export const getPlayerById: ApiHandler<Player, GetPlayerByIdParams> = async (queryClient, args) => {
  const {
    params: { playerId },
  } = args;
  const players = queryClient.getQueryData<Player[]>([playersCacheKey])!;

  return players.find(({ id }) => id === playerId)!;
};

type GetVillagesByPlayerParams = {
  playerId: Player['id'];
};

export const getVillagesByPlayer: ApiHandler<PlayerVillage[], GetVillagesByPlayerParams> = async (queryClient, args) => {
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

type GetTroopsByVillageParams = {
  playerId: Player['id'];
  villageId: Village['id'];
};

export const getTroopsByVillage: ApiHandler<Troop[], GetTroopsByVillageParams> = async (queryClient, args) => {
  const {
    params: { playerId, villageId },
  } = args;

  if (playerId === 'player') {
    const playerTroops = queryClient.getQueryData<Troop[]>([playerTroopsCacheKey]) ?? [];
    return playerTroops.filter(({ tileId }) => tileId === villageId);
  }

  const troops = queryClient.getQueryData<Troop[]>([troopsCacheKey]) ?? [];
  return troops.filter(({ tileId }) => tileId === villageId);
};

type GetTroopMovementsByVillageParams = {
  playerId: Player['id'];
  villageId: Village['id'];
};

export const getTroopMovementsByVillage: ApiHandler<GameEvent<'troopMovement'>[], GetTroopMovementsByVillageParams> = async (
  queryClient,
  args,
) => {
  const {
    params: { villageId },
  } = args;

  const events = queryClient.getQueryData<GameEvent<'troopMovement'>[]>([eventsCacheKey]) ?? [];
  const troopMovementEvents = events.filter(isTroopMovementEvent);
  const villageTroopMovementEvents = troopMovementEvents.filter(({ villageId: sourceVillageId, targetId }) => {
    return sourceVillageId === villageId || targetId === villageId;
  });

  return villageTroopMovementEvents;
};
