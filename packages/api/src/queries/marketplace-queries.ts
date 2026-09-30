export const selectMarketplaceVillageByIdQuery = `
  SELECT
    v.id,
    v.tile_id AS tileId,
    v.player_id AS playerId,
    ti.tribe
  FROM
    villages v
      JOIN players p ON p.id = v.player_id
      JOIN tribe_ids ti ON ti.id = p.tribe_id
  WHERE
    v.id = $village_id;
`;

export const selectMarketplaceVillageByTileIdQuery = `
  SELECT
    v.id,
    v.tile_id AS tileId,
    v.player_id AS playerId,
    ti.tribe
  FROM
    villages v
      JOIN players p ON p.id = v.player_id
      JOIN tribe_ids ti ON ti.id = p.tribe_id
  WHERE
    v.tile_id = $tile_id;
`;

export const selectMarketplaceVillageWithTargetByTileIdQuery = `
  WITH source_village AS (
    ${selectMarketplaceVillageByTileIdQuery.replace(/;\s*$/u, '')}
  )
  SELECT
    source_village.*,
    target_village.id AS targetVillageId,
    target_village.tile_id AS targetVillageTileId
  FROM
    source_village
      LEFT JOIN villages target_village ON target_village.tile_id = $target_tile_id;
`;

const selectVillageMerchantStatsQuery = `
  SELECT
    v.id,
    v.tile_id AS tileId,
    v.player_id AS playerId,
    ti.tribe,
    COALESCE(
      (
        SELECT MAX(bf.level)
        FROM
          building_fields bf
            JOIN building_ids bi ON bi.id = bf.building_id
        WHERE
          bf.village_id = v.id
          AND bi.building = 'MARKETPLACE'
          AND bf.level > 0
      ),
      0
    ) AS marketplaceLevel,
    COALESCE(
      (
        SELECT SUM(CAST(JSON_EXTRACT(e.meta, '$.merchantAmount') AS INTEGER))
        FROM events e
        WHERE
          e.village_id = v.id
          AND e.type = 'resourceTransfer'
      ),
      0
    ) AS usedMerchantAmount,
    COALESCE(
      (
        SELECT JSON_GROUP_ARRAY(
          JSON_OBJECT(
            'id', ei.effect,
            'value', e.value,
            'type', et.type,
            'scope', es.scope,
            'source', eso.source,
            'tileId', e.tile_id,
            'sourceSpecifier', e.source_specifier
          )
        )
        FROM
          effects e
            JOIN effect_ids ei ON ei.id = e.effect_id
            JOIN effect_type_ids et ON et.id = e.type_id
            JOIN effect_scope_ids es ON es.id = e.scope_id
            JOIN effect_source_ids eso ON eso.id = e.source_id
        WHERE
          ei.effect = 'merchantCapacity'
          AND (
            e.scope_id IN (
              SELECT id
              FROM effect_scope_ids
              WHERE scope IN ('global', 'server')
            )
            OR e.tile_id = v.tile_id
          )
      ),
      '[]'
    ) AS effectsJson
  FROM
    villages v
      JOIN players p ON p.id = v.player_id
      JOIN tribe_ids ti ON ti.id = p.tribe_id
`;

export const selectVillageMerchantStatsByVillageIdQuery = `
  ${selectVillageMerchantStatsQuery}
  WHERE
    v.id = $village_id;
`;

export const selectVillageMerchantStatsByTileIdQuery = `
  ${selectVillageMerchantStatsQuery}
  WHERE
    v.tile_id = $tile_id;
`;

export const selectVillageMerchantStatsWithTargetByTileIdQuery = `
  WITH source_village AS (
    ${selectVillageMerchantStatsQuery}
    WHERE
      v.tile_id = $tile_id
  )
  SELECT
    source_village.*,
    target_village.id AS targetVillageId,
    target_village.tile_id AS targetVillageTileId
  FROM
    source_village
      LEFT JOIN villages target_village ON target_village.tile_id = $target_tile_id;
`;

export const selectMerchantMovementStatsByVillageIdQuery = `
  SELECT
    ti.tribe,
    s.map_size AS mapSize,
    s.speed
  FROM
    villages v
      JOIN players p ON p.id = v.player_id
      JOIN tribe_ids ti ON ti.id = p.tribe_id
      CROSS JOIN servers s
  WHERE
    v.id = $village_id;
`;

export const updateTradeRouteQuery = `
  UPDATE events
  SET
    starts_at = $starts_at,
    meta = $meta
  WHERE
    id = $event_id
    AND village_id = $village_id
    AND type = 'tradeRoute'
  RETURNING changes();
`;

export const deleteTradeRouteByTileIdQuery = `
  DELETE
  FROM events
  WHERE
    id = $event_id
    AND village_id = (
      SELECT id
      FROM villages
      WHERE tile_id = $tile_id
    )
    AND type = 'tradeRoute';
`;
