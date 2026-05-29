export const selectPlayerByIdQuery = `
  SELECT
    p.id,
    p.name,
    p.slug,
    ti.tribe,
    fi.faction AS faction
  FROM
    players p
      JOIN tribe_ids ti ON p.tribe_id = ti.id
      LEFT JOIN faction_ids fi ON fi.id = p.faction_id
  WHERE
    p.id = $player_id;
`;

export const selectPlayerVillageListingQuery = `
  SELECT
    v.id,
    v.tile_id,
    t.x AS coordinates_x,
    t.y AS coordinates_y,
    v.name,
    v.slug,
    rfc.resource_field_composition AS resource_field_composition
  FROM
    villages v
      JOIN tiles t ON t.id = v.tile_id
      LEFT JOIN resource_field_composition_ids rfc ON t.resource_field_composition_id = rfc.id
  WHERE
    v.player_id = $player_id;
`;

export const selectPlayerVillagesWithPopulationQuery = `
  SELECT
    v.id,
    v.tile_id,
    t.x AS coordinates_x,
    t.y AS coordinates_y,
    v.name,
    v.slug,
    rfc.resource_field_composition AS resource_field_composition,
    COALESCE(SUM(CASE WHEN ei.effect = 'wheatProduction' THEN e.value * -1 ELSE 0 END), 0) AS population
  FROM
    villages v
      JOIN tiles t ON t.id = v.tile_id
      LEFT JOIN resource_field_composition_ids rfc ON t.resource_field_composition_id = rfc.id
      LEFT JOIN effects e ON e.village_id = v.id
        AND e.type = 'base'
        AND e.scope = 'village'
        AND e.source = 'building'
        AND e.source_specifier = 0
      LEFT JOIN effect_ids ei ON ei.id = e.effect_id
  WHERE
    v.player_id = $player_id
  GROUP BY
    v.id, v.tile_id, t.x, t.y, v.name, v.slug, rfc.resource_field_composition
  ORDER BY
    population DESC;
`;

export const selectVillageTroopsQuery = `
  SELECT
    ui.unit AS unit_id,
    t.amount,
    t.tile_id,
    t.source_tile_id
  FROM
    troops t
      JOIN unit_ids ui ON ui.id = t.unit_id
  WHERE
    t.tile_id = (
      SELECT v.tile_id
      FROM
        villages v
      WHERE
        v.id = $village_id
    );
`;

export const updateVillageNameQuery = `
  UPDATE villages
  SET
    name = $name
  WHERE
    id = $village_id;
`;

export const selectPlayerBySlugQuery = `
  SELECT
    p.id,
    p.name,
    p.slug,
    ti.tribe,
    fi.faction
  FROM
    players p
      JOIN tribe_ids ti ON p.tribe_id = ti.id
      JOIN villages v ON v.player_id = p.id
      LEFT JOIN faction_ids fi ON fi.id = p.faction_id
  WHERE
    p.slug = $player_slug
  LIMIT 1;
`;
