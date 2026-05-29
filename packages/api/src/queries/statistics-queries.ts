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
          LEFT JOIN effects e ON e.village_id = v.id
          AND e.type = 'base'
          AND e.scope = 'village'
          AND e.source = 'building'
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
          LEFT JOIN effects e ON e.village_id = v.id
            AND e.type = 'base'
            AND e.scope = 'village'
            AND e.source = 'building'
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
