export const selectPlayerRankingsQuery = `
  WITH
    player_pop AS (
      SELECT
        p.id,
        p.name,
        p.slug,
        ti.tribe,
        fi.faction AS faction,
        SUM(CASE WHEN ei.effect = 'wheatProduction' THEN e.value * -1 ELSE 0 END) AS total_population,
        COUNT(DISTINCT v.id) AS village_count
      FROM
        players p
          JOIN tribe_ids ti ON p.tribe_id = ti.id
          JOIN faction_ids fi ON fi.id = p.faction_id
          LEFT JOIN villages v ON v.player_id = p.id
          LEFT JOIN effects e ON e.tile_id = v.tile_id
          AND e.type_id = (SELECT id FROM effect_type_ids WHERE type = 'base')
          AND e.scope_id = (SELECT id FROM effect_scope_ids WHERE scope = 'local')
          AND e.source_id = (SELECT id FROM effect_source_ids WHERE source = 'building')
          AND e.source_specifier = 0
          LEFT JOIN effect_ids ei ON ei.id = e.effect_id
      GROUP BY
        p.id,
        p.name,
        p.slug,
        ti.tribe,
        fi.faction
      ),

    cursor_row AS (
      SELECT total_population, id
      FROM
        player_pop
      WHERE
        id = $last_player_id
      )

  SELECT
    id,
    name,
    slug,
    tribe,
    faction,
    total_population,
    village_count
  FROM
    player_pop
  WHERE
    ($last_player_id IS NULL)
    OR (
      EXISTS
      (
        SELECT 1
        FROM
          cursor_row
        )
        AND (
        (
          total_population < (
            SELECT total_population
            FROM
              cursor_row
            )
          )
          OR (
          total_population = (
            SELECT total_population
            FROM
              cursor_row
            )
            AND id > $last_player_id
          )
        )
      )
  ORDER BY
    total_population DESC, id;
`;

export const selectVillageRankingsQuery = `
  WITH
    village_pop AS (
      SELECT
        v.id AS village_id,
        v.name AS village_name,
        t.x AS coordinates_x,
        t.y AS coordinates_y,
        v.player_id,
        p.name AS player_name,
        p.slug AS player_slug,
        SUM(CASE WHEN ei.effect = 'wheatProduction' THEN e.value * -1 ELSE 0 END) AS population
      FROM
        villages v
          LEFT JOIN tiles t ON t.id = v.tile_id
          LEFT JOIN players p ON p.id = v.player_id
          LEFT JOIN effects e ON e.tile_id = v.tile_id
            AND e.type_id = (SELECT id FROM effect_type_ids WHERE type = 'base')
            AND e.scope_id = (SELECT id FROM effect_scope_ids WHERE scope = 'local')
            AND e.source_id = (SELECT id FROM effect_source_ids WHERE source = 'building')
            AND e.source_specifier = 0
          LEFT JOIN effect_ids ei ON ei.id = e.effect_id
      GROUP BY v.id, v.name, t.x, t.y, v.player_id, p.name, p.slug
    ),

    cursor_row AS (
      SELECT population, village_id
      FROM
        village_pop
      WHERE
        village_id = $last_village_id
    )

  SELECT
    village_id,
    village_name,
    coordinates_x,
    coordinates_y,
    population,
    player_id,
    player_name,
    player_slug
  FROM
    village_pop
  WHERE
    ($last_village_id IS NULL)
    OR (
      EXISTS
      (
        SELECT 1
        FROM
          cursor_row
      )
      AND (
        (
          population < (
            SELECT population
            FROM
              cursor_row
          )
        )
        OR (
          population = (
            SELECT population
            FROM
              cursor_row
          )
          AND village_id > $last_village_id
        )
      )
    )
  ORDER BY
    population DESC, village_id;
`;

export const selectStatisticsComparisonVillagesQuery = `
  SELECT
    v.id AS village_id,
    v.name AS village_name,
    t.id AS tile_id,
    t.x AS coordinates_x,
    t.y AS coordinates_y,
    p.id AS player_id,
    p.name AS player_name,
    p.slug AS player_slug,
    ti.tribe,
    fi.faction
  FROM
    villages v
      JOIN tiles t ON t.id = v.tile_id
      JOIN players p ON p.id = v.player_id
      JOIN tribe_ids ti ON ti.id = p.tribe_id
      JOIN faction_ids fi ON fi.id = p.faction_id
  ORDER BY
    v.id;
`;

export const selectStatisticsComparisonEffectsQuery = `
  SELECT
    ei.effect AS id,
    e.value,
    et.type,
    es.scope,
    eso.source,
    e.tile_id AS tileId,
    e.source_specifier AS sourceSpecifier
  FROM
    effects AS e
      JOIN effect_ids AS ei ON ei.id = e.effect_id
      JOIN effect_type_ids AS et ON et.id = e.type_id
      JOIN effect_scope_ids AS es ON es.id = e.scope_id
      JOIN effect_source_ids AS eso ON eso.id = e.source_id
  WHERE
    ei.effect IN (
      'woodProduction',
      'clayProduction',
      'ironProduction',
      'wheatProduction',
      'unitWheatConsumption'
    );
`;

export const selectStatisticsComparisonTroopsQuery = `
  WITH
    stationary_troops AS (
      SELECT
        source_v.id AS village_id,
        source_v.player_id,
        ui.unit AS unit_id,
        SUM(t.amount) AS amount
      FROM
        troops t
          JOIN unit_ids ui ON ui.id = t.unit_id
          JOIN villages source_v ON source_v.tile_id = t.source_tile_id
      GROUP BY
        source_v.id,
        source_v.player_id,
        ui.unit
    ),
    moving_troops AS (
      SELECT
        source_v.id AS village_id,
        source_v.player_id,
        JSON_EXTRACT(troop.value, '$.unitId') AS unit_id,
        SUM(CAST(JSON_EXTRACT(troop.value, '$.amount') AS INTEGER)) AS amount
      FROM
        events e,
        JSON_EACH(e.meta, '$.troops') AS troop
          JOIN villages source_v
            ON source_v.tile_id = CAST(JSON_EXTRACT(troop.value, '$.sourceTileId') AS INTEGER)
      WHERE
        e.type IN (
          'troopMovementReinforcements',
          'troopMovementRelocation',
          'troopMovementReturn',
          'troopMovementFindNewVillage',
          'troopMovementAttack',
          'troopMovementRaid',
          'troopMovementOasisOccupation',
          'troopMovementAdventure'
        )
      GROUP BY
        source_v.id,
        source_v.player_id,
        JSON_EXTRACT(troop.value, '$.unitId')
    ),
    all_troops AS (
      SELECT * FROM stationary_troops
      UNION ALL
      SELECT * FROM moving_troops
    )
  SELECT
    village_id,
    player_id,
    unit_id,
    SUM(amount) AS amount
  FROM
    all_troops
  GROUP BY
    village_id,
    player_id,
    unit_id;
`;

export const selectStatisticsComparisonUnitImprovementsQuery = `
  SELECT
    ui.player_id,
    unit_ids.unit AS unit_id,
    ui.level
  FROM
    unit_improvements ui
      JOIN unit_ids ON unit_ids.id = ui.unit_id;
`;

export const selectPlayerStatsByTribeAndFactionQuery = `
  SELECT
    ti.tribe AS tribe,
    fi.faction AS faction,
    COUNT(p.id) AS player_count
  FROM
    players p
      JOIN tribe_ids ti ON p.tribe_id = ti.id
      JOIN faction_ids fi ON fi.id = p.faction_id
  GROUP BY
    ti.tribe, fi.faction;
`;

export const selectVillageStatsByTribeAndFactionQuery = `
  SELECT
    ti.tribe AS tribe,
    fi.faction AS faction,
    COUNT(v.id) AS village_count
  FROM
    villages v
      JOIN players p ON v.player_id = p.id
      JOIN tribe_ids ti ON p.tribe_id = ti.id
      JOIN faction_ids fi ON fi.id = p.faction_id
  GROUP BY
    ti.tribe, fi.faction;
`;
