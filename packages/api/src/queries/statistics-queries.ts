export const selectPlayerRankingsQuery = `
  WITH
    -- Reuse each population calculation for cursor lookup and the returned rows.
    player_pop AS MATERIALIZED (
      SELECT
        p.id,
        p.name,
        p.slug,
        ti.tribe,
        fi.faction AS faction,
        COALESCE((
          SELECT SUM(-e.value)
          FROM villages v
          -- Seek effects on this player's villages, rather than scanning world effects.
          CROSS JOIN effects e ON e.tile_id = v.tile_id
          WHERE v.player_id = p.id
            AND e.effect_id = (SELECT id FROM effect_ids WHERE effect = 'wheatProduction')
            AND e.type_id = (SELECT id FROM effect_type_ids WHERE type = 'base')
            AND e.scope_id = (SELECT id FROM effect_scope_ids WHERE scope = 'local')
            AND e.source_id = (SELECT id FROM effect_source_ids WHERE source = 'building')
            AND e.source_specifier = 0
        ), 0) AS total_population,
        (SELECT COUNT(*) FROM villages v WHERE v.player_id = p.id) AS village_count
      FROM
        players p
          JOIN tribe_ids ti ON p.tribe_id = ti.id
          JOIN faction_ids fi ON fi.id = p.faction_id
      ),

    cursor_row AS MATERIALIZED (
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
    -- Keep the correlated sum from being repeated by the cursor predicates.
    village_pop AS MATERIALIZED (
      SELECT
        v.id AS village_id,
        v.name AS village_name,
        t.x AS coordinates_x,
        t.y AS coordinates_y,
        v.player_id,
        p.name AS player_name,
        p.slug AS player_slug,
        COALESCE((
          SELECT SUM(-e.value)
          FROM effects e
          WHERE e.tile_id = v.tile_id
            AND e.effect_id = (SELECT id FROM effect_ids WHERE effect = 'wheatProduction')
            AND e.type_id = (SELECT id FROM effect_type_ids WHERE type = 'base')
            AND e.scope_id = (SELECT id FROM effect_scope_ids WHERE scope = 'local')
            AND e.source_id = (SELECT id FROM effect_source_ids WHERE source = 'building')
            AND e.source_specifier = 0
        ), 0) AS population
      FROM
        villages v
          LEFT JOIN tiles t ON t.id = v.tile_id
          LEFT JOIN players p ON p.id = v.player_id
    ),

    cursor_row AS MATERIALIZED (
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

export const selectPlayerStatsByTribeAndFactionQuery = `
  SELECT
    ti.tribe AS tribe,
    fi.faction AS faction,
    counts.player_count
  FROM (
    SELECT tribe_id, faction_id, COUNT(*) AS player_count
    FROM players
    GROUP BY tribe_id, faction_id
  ) counts
    JOIN tribe_ids ti ON ti.id = counts.tribe_id
    JOIN faction_ids fi ON fi.id = counts.faction_id;
`;

export const selectVillageStatsByTribeAndFactionQuery = `
  SELECT
    ti.tribe AS tribe,
    fi.faction AS faction,
    counts.village_count
  FROM (
    SELECT
      p.tribe_id,
      p.faction_id,
      COUNT(*) AS village_count
    FROM villages v
      JOIN players p ON v.player_id = p.id
    GROUP BY p.tribe_id, p.faction_id
  ) counts
    JOIN tribe_ids ti ON ti.id = counts.tribe_id
    JOIN faction_ids fi ON fi.id = counts.faction_id;
`;
