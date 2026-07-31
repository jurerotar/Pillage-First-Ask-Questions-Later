export const selectScheduledBuildingUpgradesQuery = `
  SELECT
    sbu.id,
    bi.building AS buildingId,
    sbu.village_id AS villageId,
    sbu.building_field_id AS buildingFieldId,
    sbu.level
  FROM scheduled_building_upgrades sbu
  JOIN building_ids bi ON bi.id = sbu.building_id
  WHERE sbu.village_id = $village_id
  ORDER BY sbu.queue_position, sbu.id;
`;

export const selectNextScheduledBuildingUpgradeQuery = `
  SELECT
    sbu.id,
    bi.building AS buildingId,
    sbu.village_id AS villageId,
    sbu.building_field_id AS buildingFieldId,
    sbu.level
  FROM scheduled_building_upgrades sbu
  JOIN building_ids bi ON bi.id = sbu.building_id
  JOIN villages v ON v.id = sbu.village_id
  JOIN players p ON p.id = v.player_id
  JOIN tribe_ids ti ON ti.id = p.tribe_id
  WHERE sbu.village_id = $village_id
    AND (
      $building_field_id IS NULL
      OR ti.tribe <> 'romans'
      OR (
        sbu.building_field_id <= 18
        AND $building_field_id <= 18
      )
      OR (
        sbu.building_field_id > 18
        AND $building_field_id > 18
      )
    )
  ORDER BY sbu.queue_position, sbu.id
  LIMIT 1;
`;

export const insertScheduledBuildingUpgradeQuery = `
  INSERT INTO scheduled_building_upgrades (
    building_id,
    village_id,
    building_field_id,
    level,
    queue_position
  )
  VALUES (
    (SELECT id FROM building_ids WHERE building = $building_id),
    $village_id,
    $building_field_id,
    $level,
    COALESCE(
      (
        SELECT MAX(queue_position) + 1
        FROM scheduled_building_upgrades
        WHERE village_id = $village_id
      ),
      0
    )
  );
`;

export const deleteScheduledBuildingUpgradeChainQuery = `
  DELETE FROM scheduled_building_upgrades
  WHERE village_id = $village_id
    AND building_id = (
      SELECT id FROM building_ids WHERE building = $building_id
    )
    AND building_field_id = $building_field_id
    AND level >= $level;
`;

export const deleteScheduledBuildingUpgradeByIdQuery = `
  DELETE FROM scheduled_building_upgrades
  WHERE id = $id;
`;

export const insertScheduledConstructionCancellationHistoryQuery = `
  INSERT INTO scheduled_building_construction_cancellation_history (
    village_id,
    field_id,
    building_id,
    level,
    timestamp
  )
  VALUES (
    $village_id,
    $field_id,
    (SELECT id FROM building_ids WHERE building = $building_id),
    $level,
    unixepoch()
  );
`;

export const selectActiveAndScheduledBuildingConstructionCountQuery = `
  SELECT
    (
      SELECT COUNT(*)
      FROM events
      WHERE village_id = $village_id
        AND (
          type = 'buildingConstruction'
          OR (
            type = 'buildingLevelChange'
            AND CAST(JSON_EXTRACT(meta, '$.level') AS INTEGER) >
                CAST(JSON_EXTRACT(meta, '$.previousLevel') AS INTEGER)
          )
        )
    )
    +
    (
      SELECT COUNT(*)
      FROM scheduled_building_upgrades
      WHERE village_id = $village_id
    );
`;

export const selectScheduledBuildingVirtualLevelQuery = `
  SELECT MAX(level)
  FROM (
    SELECT bf.level
    FROM building_fields bf
    JOIN building_ids bi ON bi.id = bf.building_id
    WHERE bf.village_id = $village_id
      AND bf.field_id = $building_field_id
      AND bi.building = $building_id

    UNION ALL

    SELECT CAST(JSON_EXTRACT(meta, '$.level') AS INTEGER)
    FROM events
    WHERE village_id = $village_id
      AND type IN ('buildingConstruction', 'buildingLevelChange')
      AND CAST(JSON_EXTRACT(meta, '$.buildingFieldId') AS INTEGER) =
          $building_field_id

    UNION ALL

    SELECT level
    FROM scheduled_building_upgrades
    WHERE village_id = $village_id
      AND building_field_id = $building_field_id
  );
`;

export const selectBuildingFieldForScheduledUpgradeQuery = `
  SELECT bi.building AS buildingId, bf.level
  FROM building_fields bf
  JOIN building_ids bi ON bi.id = bf.building_id
  WHERE bf.village_id = $village_id
    AND bf.field_id = $building_field_id;
`;

export const selectBuildingFieldPendingConstructionExistsQuery = `
  SELECT EXISTS (
    SELECT 1
    FROM events
    WHERE village_id = $village_id
      AND type IN ('buildingConstruction', 'buildingLevelChange')
      AND CAST(JSON_EXTRACT(meta, '$.buildingFieldId') AS INTEGER) =
          $building_field_id

    UNION ALL

    SELECT 1
    FROM scheduled_building_upgrades
    WHERE village_id = $village_id
      AND building_field_id = $building_field_id
  );
`;

export const updateScheduledBuildingUpgradeQueuePositionQuery = `
  UPDATE scheduled_building_upgrades
  SET queue_position = $queue_position
  WHERE id = $id AND village_id = $village_id;
`;

export const selectScheduledBuildingUpgradeCancellationTargetQuery = `
  SELECT
    bi.building AS buildingId,
    sbu.building_field_id AS buildingFieldId,
    sbu.level
  FROM scheduled_building_upgrades sbu
  JOIN building_ids bi ON bi.id = sbu.building_id
  WHERE sbu.id = $id AND sbu.village_id = $village_id;
`;

export const deleteScheduledBuildingUpgradesByVillageAndFieldQuery = `
  DELETE FROM scheduled_building_upgrades
  WHERE village_id = $village_id
    AND building_field_id = $building_field_id;
`;
