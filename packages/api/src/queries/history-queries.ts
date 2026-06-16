export const selectBuildingLevelChangeHistoryQuery = `
  SELECT
    h.field_id,
    bi.building,
    h.previous_level,
    h.new_level,
    h.timestamp
  FROM
    building_level_change_history h
      JOIN building_ids bi ON h.building_id = bi.id
  WHERE
    h.village_id = $village_id
  ORDER BY
    h.timestamp DESC;
`;

export const selectUnitTrainingHistoryQuery = `
  SELECT
    h.batch_id,
    ui.unit,
    bi.building,
    h.amount,
    h.timestamp
  FROM
    unit_training_history h
      JOIN unit_ids ui ON h.unit_id = ui.id
      JOIN building_ids bi ON h.building_id = bi.id
  WHERE
    h.village_id = $village_id
    AND ($building_id IS NULL OR bi.building = $building_id)
  ORDER BY
    h.timestamp DESC;
`;
