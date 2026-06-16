export const selectPlayerFarmListsQuery = `
  SELECT
    fl.id,
    fl.name,
    fl.village_id AS villageId,
    (
      SELECT COUNT(*)
      FROM farm_list_tiles
      WHERE farm_list_id = fl.id
      ) AS targetCount
  FROM
    farm_lists fl
      JOIN villages v ON v.id = fl.village_id
  WHERE
    v.player_id = $player_id;
`;

export const selectVillageFarmListsQuery = `
  SELECT
    id,
    name,
    village_id AS villageId,
    (SELECT COUNT(*) FROM farm_list_tiles WHERE farm_list_id = id) AS targetCount
  FROM
    farm_lists
  WHERE
    village_id = $village_id;
`;

export const insertFarmListQuery = `
  INSERT INTO farm_lists (village_id, name)
  VALUES
    ($village_id, $name);
`;

export const selectFarmListQuery = `
  SELECT
    id,
    name,
    village_id AS villageId,
    (
      SELECT COUNT(*)
      FROM farm_list_tiles
      WHERE farm_list_id = $farm_list_id
      ) AS targetCount
  FROM
    farm_lists
  WHERE
    id = $farm_list_id;
`;

export const selectFarmListTileIdsQuery = `
  SELECT tile_id
  FROM
    farm_list_tiles
  WHERE
    farm_list_id = $farm_list_id;
`;

export const deleteFarmListQuery = `
  DELETE
  FROM
    farm_lists
  WHERE
    id = $farm_list_id;
`;

export const selectFarmListTileCountQuery = `
  SELECT COUNT(*)
  FROM
    farm_list_tiles
  WHERE
    farm_list_id = $farm_list_id;
`;

export const insertFarmListTileQuery = `
  INSERT OR IGNORE INTO farm_list_tiles (farm_list_id, tile_id)
  VALUES
    ($farm_list_id, $tile_id);
`;

export const deleteFarmListTileQuery = `
  DELETE
  FROM
    farm_list_tiles
  WHERE
    farm_list_id = $farm_list_id
    AND tile_id = $tile_id;
`;

export const deletePlayerFarmListTileQuery = `
  DELETE
  FROM
    farm_list_tiles
  WHERE
    tile_id = $tile_id
    AND farm_list_id IN (
      SELECT fl.id
      FROM
        farm_lists fl
          JOIN villages v ON v.id = fl.village_id
      WHERE
        v.player_id = $player_id
    );
`;

export const selectFarmListNameQuery = `
  SELECT name
  FROM
    farm_lists
  WHERE
    id = $farm_list_id;
`;

export const selectLastInsertedRowIdQuery = `
  SELECT last_insert_rowid();
`;

export const insertClonedFarmListTilesQuery = `
  INSERT INTO farm_list_tiles (farm_list_id, tile_id)
  SELECT $cloned_farm_list_id, tile_id
  FROM
    farm_list_tiles
  WHERE
    farm_list_id = $farm_list_id;
`;

export const updateFarmListNameQuery = `
  UPDATE farm_lists
  SET
    name = $name
  WHERE
    id = $farm_list_id;
`;

export const updateFarmListVillageQuery = `
  UPDATE farm_lists
  SET
    village_id = $village_id
  WHERE
    id = $farm_list_id;
`;
