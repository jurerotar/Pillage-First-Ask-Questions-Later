export const selectTargetVillageIdByTileIdQuery = `
  SELECT id
  FROM villages
  WHERE tile_id = $target_tile_id;
`;

export const selectResourceSiteResourcesByTileIdQuery = `
  SELECT wood, clay, iron, wheat
  FROM resource_sites
  WHERE tile_id = $target_tile_id;
`;

export const updateResourceSiteResourcesByTileIdQuery = `
  UPDATE resource_sites
  SET
    wood = wood - $wood,
    clay = clay - $clay,
    iron = iron - $iron,
    wheat = wheat - $wheat,
    updated_at = $updated_at
  WHERE tile_id = $target_tile_id;
`;

export const selectTargetOwnerPlayerIdByTileIdQuery = `
  SELECT COALESCE(target_v.player_id, oasis_owner_v.player_id)
  FROM
    tiles t
    LEFT JOIN villages target_v ON target_v.tile_id = t.id
    LEFT JOIN villages oasis_owner_v ON oasis_owner_v.id = (
      SELECT MAX(village_id)
      FROM oasis
      WHERE tile_id = t.id
    )
  WHERE t.id = $target_tile_id;
`;

export const selectHomeDefenderUnitsByTargetTileIdQuery = `
  SELECT ui.unit AS unit_id, SUM(t.amount) AS amount
  FROM
    troops t
    JOIN unit_ids ui ON ui.id = t.unit_id
  WHERE
    t.tile_id = $target_tile_id
    AND t.source_tile_id = $target_tile_id
  GROUP BY ui.unit;
`;

export const selectDefenderReinforcementsByTargetTileIdQuery = `
  SELECT
    t.source_tile_id,
    v.player_id,
    ui.unit AS unit_id,
    SUM(t.amount) AS amount
  FROM
    troops t
    JOIN unit_ids ui ON ui.id = t.unit_id
    LEFT JOIN villages v ON v.tile_id = t.source_tile_id
  WHERE
    t.tile_id = $target_tile_id
    AND t.source_tile_id != $target_tile_id
  GROUP BY t.source_tile_id, v.player_id, ui.unit;
`;

export const selectHeroAdventureContextByVillageIdQuery = `
  SELECT
    h.id AS heroId,
    h.health AS healthBefore,
    ha.completed + 1 AS adventureId
  FROM
    heroes h
    JOIN hero_adventures ha ON h.id = ha.hero_id
  WHERE
    h.player_id = (
      SELECT player_id
      FROM villages
      WHERE id = $village_id
    );
`;

export const updateHeroAfterAdventureByHeroIdQuery = `
  UPDATE heroes
  SET
    health = MAX(0, health - MAX(0, 5 - damage_reduction)),
    experience =
      experience +
      CASE
        WHEN MAX(0, health - MAX(0, 5 - damage_reduction)) > 0
          THEN (
                 SELECT completed + 1
                 FROM
                   hero_adventures
                 WHERE
                   hero_id = heroes.id
                 ) * 10
        ELSE 0
        END
  WHERE id = $hero_id
  RETURNING health
`;

export const updateCompletedHeroAdventuresByHeroIdQuery = `
  UPDATE hero_adventures
  SET completed = completed + 1
  WHERE hero_id = $hero_id;
`;

export const selectNewVillageFoundationTileByTileIdAndPlayerIdQuery = `
  SELECT
    t.id,
    t.x,
    t.y,
    rfc.resource_field_composition AS resourceFieldComposition,
    ti.tribe
  FROM
    tiles t
      JOIN resource_field_composition_ids rfc
           ON t.resource_field_composition_id = rfc.id
      CROSS JOIN players p
      JOIN tribe_ids ti
           ON p.tribe_id = ti.id
  WHERE
    t.id = $tile_id
    AND p.id = $player_id;
`;

export const insertVillageForPlayerQuery = `
  WITH
    next_slug AS (
      SELECT 'v-' || (COUNT(*) + 1) AS slug
      FROM
        villages
      WHERE
        player_id = $player_id
      )
  INSERT
  INTO
    villages (name, slug, tile_id, player_id)
  SELECT
    $name,
    (
      SELECT slug
      FROM
        next_slug
      ),
    $tile_id,
    $player_id
      RETURNING id;
`;

export const insertGatherersHutExpeditionByVillageIdQuery = `
  INSERT INTO gatherers_hut_expeditions (village_id, completed)
  VALUES ($village_id, 0)
  ON CONFLICT(village_id) DO NOTHING;
`;

export const selectBuildingIdsQuery = `
  SELECT id, building
  FROM building_ids
`;

export const insertBuildingFieldsQuery = `
  INSERT INTO building_fields (village_id, field_id, building_id, level)
  SELECT
    $village_id,
    json_extract(field.value, '$.fieldId'),
    json_extract(field.value, '$.buildingId'),
    json_extract(field.value, '$.level')
  FROM json_each($fields) AS field;
`;

export const insertBuildingEffectsQuery = `
  INSERT INTO effects (
    effect_id,
    value,
    type_id,
    scope_id,
    source_id,
    village_id,
    source_specifier
  )
  SELECT
    effect_ids.id,
    json_extract(effect.value, '$.value'),
    effect_type_ids.id,
    effect_scope_ids.id,
    effect_source_ids.id,
    $village_id,
    json_extract(effect.value, '$.sourceSpecifier')
  FROM
    json_each($effects) AS effect
    JOIN effect_ids
      ON effect_ids.effect = json_extract(effect.value, '$.effectId')
    JOIN effect_type_ids
      ON effect_type_ids.type = json_extract(effect.value, '$.type')
    JOIN effect_scope_ids
      ON effect_scope_ids.scope = 'local'
    JOIN effect_source_ids
      ON effect_source_ids.source = 'building';
`;

export const insertResourceSiteByTileIdQuery = `
  INSERT INTO
    resource_sites (tile_id, wood, clay, iron, wheat, updated_at)
  VALUES
    ($tile_id, 750, 750, 750, 750, $updatedAt)
  ON CONFLICT(tile_id) DO NOTHING;
`;

export const insertNewVillageQuestsQuery = `
  INSERT INTO quests (quest_id, completed_at, collected_at, village_id)
  SELECT
    quest.value,
    CASE
      WHEN quest.value = 'oneOf-MAIN_BUILDING-1' THEN $resolves_at
      ELSE NULL
    END,
    NULL,
    $village_id
  FROM json_each($quests) AS quest;
`;

export const insertVillageFoundingHistoryQuery = `
  INSERT INTO
    village_founding_history (village_id, tile_id, x, y, timestamp)
  VALUES
    ($village_id, $tile_id, $x, $y, $timestamp);
`;

export const selectRelocationTargetVillageIdByTileIdQuery = `
  SELECT
    CASE
      WHEN tt.type = 'free' THEN v.id
      WHEN tt.type = 'oasis' THEN (
        SELECT MAX(o.village_id)
        FROM
          oasis o
        WHERE
          o.tile_id = t.id
      )
    END
  FROM
    tiles t
      JOIN tile_type_ids tt ON tt.id = t.type_id
      LEFT JOIN villages v ON v.tile_id = t.id
  WHERE
    t.id = $tile_id;
`;
