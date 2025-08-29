import type { ApiHandler } from 'app/interfaces/api';
import { playersCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { Village, VillageModel } from 'app/interfaces/models/game/village';
import type { Troop, TroopModel } from 'app/interfaces/models/game/troop';
import { troopApiResource } from 'app/(game)/api/api-resources/troop-api-resource';
import type { Player, PlayerModel } from 'app/interfaces/models/game/player';
import { villageApiResource } from 'app/(game)/api/api-resources/village-api-resources';

export const getPlayerById: ApiHandler<Player, 'playerId'> = async (
  queryClient,
  database,
  args,
) => {
  const {
    params: { playerId },
  } = args;

  const _row = database.selectObject(
    `
      SELECT
        p.id,
        p.name,
        p.slug,
        p.tribe
      FROM players p
      WHERE p.id = $player_id;
    `,
    { $player_id: playerId },
  ) as Omit<PlayerModel, 'faction_id'>;

  const players = queryClient.getQueryData<Player[]>([playersCacheKey])!;

  return players.find(({ id }) => id === playerId)!;
};

export const getVillagesByPlayer: ApiHandler<Village[], 'playerId'> = async (
  _queryClient,
  database,
  args,
) => {
  const {
    params: { playerId },
  } = args;

  const rows = database.selectObjects(
    `
      SELECT
        v.id,
        v.tile_id,
        v.player_id,
        t.x  AS coordinates_x,
        t.y  AS coordinates_y,
        v.name,
        v.slug,
        rs.updated_at AS last_updated_at,
        rs.wood AS wood,
        rs.clay AS clay,
        rs.iron AS iron,
        rs.wheat AS wheat,
        t.resource_field_composition AS resource_field_composition,
       (
          SELECT json_group_array(
                   json_object(
                     'field_id',    bf.field_id,
                     'building_id', bf.building_id,
                     'level',       bf.level
                   )
                 )
          FROM building_fields bf
          WHERE bf.village_id = v.id
        ) AS building_fields
      FROM villages v
      JOIN tiles t
        ON t.id = v.tile_id
      LEFT JOIN resource_sites rs
        ON rs.tile_id = v.tile_id
      WHERE v.player_id = $player_id;
    `,
    { $player_id: playerId },
  ) as unknown as VillageModel[];

  return rows.map(villageApiResource);
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
      SELECT unit_id,
             amount,
             tile_id,
             source
      FROM troops
      WHERE troops.tile_id = (SELECT villages.tile_id
                              FROM villages
                              WHERE villages.id = $village_id);
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
