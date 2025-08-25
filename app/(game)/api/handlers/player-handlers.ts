import type { ApiHandler } from 'app/interfaces/api';
import {
  playersCacheKey,
  villagesCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import type { Player } from 'app/interfaces/models/game/player';
import type { Village } from 'app/interfaces/models/game/village';
import type { Troop, TroopModel } from 'app/interfaces/models/game/troop';
import { troopApiResource } from 'app/(game)/api/api-resources/troop-api-resource';

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
> = async (_queryClient, database, args) => {
  const {
    params: { villageId },
  } = args;

  const troopModels = database.selectObjects(
    `
    SELECT
      unit_id,
      amount,
      tile_id,
      source
    FROM troops
    WHERE troops.tile_id = (
      SELECT
        villages.tile_id
      FROM villages
      WHERE villages.id = ?
    );
  `,
    [villageId],
  ) as TroopModel[];

  return troopModels.map(troopApiResource);
};

type RenameVillageBody = {
  name: string;
};

export const renameVillage: ApiHandler<
  void,
  'playerId' | 'villageId',
  RenameVillageBody
> = async (queryClient, database, args) => {
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

  database.exec({
    sql: `
      UPDATE villages
      SET name = ?
      WHERE id = ?
    `,
    bind: [name, villageId],
  });
};
