export const insertOasisProductionEffectQuery = `
  INSERT INTO
    effects (effect_id, value, type, scope, source, village_id, source_specifier)
  VALUES
    ((
       SELECT id
       FROM effect_ids
       WHERE effect = $effect_id
       ), $value, $type, $scope, $source, $village_id, $source_specifier);
`;

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
    source = 'oasis'
    AND village_id = $village_id
    AND source_specifier = $source_specifier;
`;

export const abandonOasisQuery = `
  UPDATE oasis
  SET
    village_id = NULL
  WHERE
    tile_id = $oasis_tile_id
    AND village_id = $village_id;
`;
