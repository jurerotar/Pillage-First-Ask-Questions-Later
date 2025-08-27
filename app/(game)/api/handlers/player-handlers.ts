import type { ApiHandler } from 'app/interfaces/api';
import { villagesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { Village } from 'app/interfaces/models/game/village';
import type { Troop, TroopModel } from 'app/interfaces/models/game/troop';
import { troopApiResource } from 'app/(game)/api/api-resources/troop-api-resource';

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

export const getVillageListByPlayer: ApiHandler<Village[], 'playerId'> = async (
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
      WHERE villages.id = $village_id
    );
  `,
    { $village_id: villageId },
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
> = async (_queryClient, database, args) => {
  const {
    params: { villageId },
    body: { name },
  } = args;

  database.exec({
    sql: `
      UPDATE villages
      SET name = $name
      WHERE id = $village_id
    `,
    bind: { $name: name, $village_id: villageId },
  });
};
