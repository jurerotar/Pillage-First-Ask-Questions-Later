export const occupyOasisQuery = `
  UPDATE oasis
  SET
    village_id = $village_id
  WHERE
    tile_id = $oasis_tile_id;
`;

export const deleteOasisEffectsQuery = `
  DELETE
  FROM
    effects
  WHERE
    source_id = (SELECT id FROM effect_source_ids WHERE source = 'oasis')
    AND tile_id = (SELECT tile_id FROM villages WHERE id = $village_id)
    AND source_specifier = $source_specifier;
`;

export const selectOasisReinforcementsToReturnQuery = `
  SELECT
    ui.unit AS unit_id,
    t.amount,
    t.source_tile_id,
    sv.id AS source_village_id
  FROM
    troops t
      JOIN unit_ids ui ON ui.id = t.unit_id
      LEFT JOIN villages sv ON sv.tile_id = t.source_tile_id
  WHERE
    t.tile_id = $oasis_tile_id
    AND t.source_tile_id != $oasis_tile_id
    AND EXISTS (
      SELECT 1
      FROM
        oasis o
      WHERE
        o.tile_id = t.tile_id
        AND o.village_id = $village_id
    )
  ORDER BY
    t.source_tile_id,
    ui.id;
`;

export const abandonOasisQuery = `
  UPDATE oasis
  SET
    village_id = NULL
  WHERE
    tile_id = $oasis_tile_id
    AND village_id = $village_id;
`;
