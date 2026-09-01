export const selectReportListingsQuery = `
  SELECT
    r.id,
    r.village_id,
    r.timestamp,
    rty.report_type AS type,
    roi.report_outcome AS outcome,
    CASE rty.report_type
      WHEN 'battle' THEN json_object(
        'originName', origin_v.name,
        'originCoordinates', json_object('x', origin_t.x, 'y', origin_t.y),
        'targetName', CASE
          WHEN target_v.id IS NOT NULL THEN target_v.name
          WHEN target_o.tile_id IS NOT NULL AND target_o.village_id IS NOT NULL THEN 'Occupied oasis'
          WHEN target_o.tile_id IS NOT NULL THEN 'Unoccupied oasis'
          ELSE ''
        END,
        'targetCoordinates', json_object('x', target_t.x, 'y', target_t.y),
        'movementType', CASE WHEN b.is_raid = 1 THEN 'raid' ELSE 'attack' END
      )
      WHEN 'adventure' THEN json_object(
        'originPlayerName', adventure_p.name,
        'originPlayerSlug', adventure_p.slug,
        'originVillageName', adventure_v.name,
        'originCoordinates', json_object('x', adventure_t.x, 'y', adventure_t.y),
        'tribe', adventure_tribe.tribe
      )
      WHEN 'movement' THEN json_object(
        'originPlayerName', movement_origin_p.name,
        'originPlayerSlug', movement_origin_p.slug,
        'originName', movement_origin_v.name,
        'originCoordinates', json_object('x', movement_origin_t.x, 'y', movement_origin_t.y),
        'targetPlayerName', movement_target_p.name,
        'targetPlayerSlug', movement_target_p.slug,
        'targetName', CASE
          WHEN movement_target_v.id IS NOT NULL THEN movement_target_v.name
          WHEN movement_target_o.tile_id IS NOT NULL THEN 'Oasis'
          ELSE NULL
        END,
        'targetCoordinates', json_object('x', movement_target_t.x, 'y', movement_target_t.y),
        'movementType', mr.movement_type
      )
      WHEN 'trade' THEN json_object(
        'originPlayerName', trade_origin_p.name,
        'originPlayerSlug', trade_origin_p.slug,
        'originName', trade_origin_v.name,
        'originCoordinates', json_object('x', trade_origin_t.x, 'y', trade_origin_t.y),
        'targetPlayerName', trade_target_p.name,
        'targetPlayerSlug', trade_target_p.slug,
        'targetName', trade_target_v.name,
        'targetCoordinates', json_object('x', trade_target_t.x, 'y', trade_target_t.y)
      )
      WHEN 'huntingParty' THEN json_object(
        'villageName', hunting_v.name,
        'villageCoordinates', json_object('x', hunting_t.x, 'y', hunting_t.y)
      )
      WHEN 'gatheringExpedition' THEN json_object(
        'villageName', gathering_v.name,
        'villageCoordinates', json_object('x', gathering_t.x, 'y', gathering_t.y)
      )
      WHEN 'scouting' THEN json_object(
        'originPlayerName', scouting_origin_p.name,
        'originPlayerSlug', scouting_origin_p.slug,
        'originName', scouting_origin_v.name,
        'originCoordinates', json_object('x', scouting_origin_t.x, 'y', scouting_origin_t.y),
        'targetPlayerName', scouting_target_p.name,
        'targetPlayerSlug', scouting_target_p.slug,
        'targetName', scouting_target_v.name,
        'targetCoordinates', json_object('x', scouting_target_t.x, 'y', scouting_target_t.y)
      )
    END AS summary_json,
    COALESCE((
      SELECT json_group_array(rti.tag)
      FROM report_tags rt
      JOIN report_tag_ids rti ON rti.id = rt.report_tag_id
      WHERE rt.report_id = r.id
    ), '[]') AS tags_json
  FROM reports r
  JOIN report_type_ids rty ON rty.id = r.type_id
  JOIN report_outcome_ids roi ON roi.id = r.report_outcome_id
  LEFT JOIN battle_reports b ON b.report_id = r.id
  LEFT JOIN tiles origin_t ON origin_t.id = b.origin_tile_id
  LEFT JOIN villages origin_v ON origin_v.tile_id = origin_t.id
  LEFT JOIN tiles target_t ON target_t.id = b.target_tile_id
  LEFT JOIN villages target_v ON target_v.tile_id = target_t.id
  LEFT JOIN oasis target_o ON target_o.id = (
    SELECT MIN(id) FROM oasis WHERE tile_id = target_t.id
  )
  LEFT JOIN villages adventure_v ON adventure_v.id = r.village_id
  LEFT JOIN players adventure_p ON adventure_p.id = adventure_v.player_id
  LEFT JOIN tiles adventure_t ON adventure_t.id = adventure_v.tile_id
  LEFT JOIN tribe_ids adventure_tribe ON adventure_tribe.id = adventure_p.tribe_id
  LEFT JOIN movement_reports mr ON mr.report_id = r.id
  LEFT JOIN tiles movement_origin_t ON movement_origin_t.id = mr.origin_tile_id
  LEFT JOIN villages movement_origin_v ON movement_origin_v.tile_id = movement_origin_t.id
  LEFT JOIN players movement_origin_p ON movement_origin_p.id = movement_origin_v.player_id
  LEFT JOIN tiles movement_target_t ON movement_target_t.id = mr.target_tile_id
  LEFT JOIN villages movement_target_v ON movement_target_v.tile_id = movement_target_t.id
  LEFT JOIN players movement_target_p ON movement_target_p.id = movement_target_v.player_id
  LEFT JOIN (
    SELECT tile_id
    FROM oasis
    GROUP BY tile_id
  ) movement_target_o ON movement_target_o.tile_id = movement_target_t.id
  LEFT JOIN trade_reports tr ON tr.report_id = r.id
  LEFT JOIN tiles trade_origin_t ON trade_origin_t.id = tr.origin_tile_id
  LEFT JOIN villages trade_origin_v ON trade_origin_v.tile_id = trade_origin_t.id
  LEFT JOIN players trade_origin_p ON trade_origin_p.id = trade_origin_v.player_id
  LEFT JOIN tiles trade_target_t ON trade_target_t.id = tr.target_tile_id
  LEFT JOIN villages trade_target_v ON trade_target_v.tile_id = trade_target_t.id
  LEFT JOIN players trade_target_p ON trade_target_p.id = trade_target_v.player_id
  LEFT JOIN hunting_party_reports hpr ON hpr.report_id = r.id
  LEFT JOIN tiles hunting_t ON hunting_t.id = hpr.village_tile_id
  LEFT JOIN villages hunting_v ON hunting_v.tile_id = hunting_t.id
  LEFT JOIN gathering_expedition_reports ger ON ger.report_id = r.id
  LEFT JOIN tiles gathering_t ON gathering_t.id = ger.village_tile_id
  LEFT JOIN villages gathering_v ON gathering_v.tile_id = gathering_t.id
  LEFT JOIN scouting_reports sr ON sr.report_id = r.id
  LEFT JOIN tiles scouting_origin_t ON scouting_origin_t.id = sr.origin_tile_id
  LEFT JOIN villages scouting_origin_v ON scouting_origin_v.tile_id = scouting_origin_t.id
  LEFT JOIN players scouting_origin_p ON scouting_origin_p.id = scouting_origin_v.player_id
  LEFT JOIN tiles scouting_target_t ON scouting_target_t.id = sr.target_tile_id
  LEFT JOIN villages scouting_target_v ON scouting_target_v.tile_id = scouting_target_t.id
  LEFT JOIN players scouting_target_p ON scouting_target_p.id = scouting_target_v.player_id
  WHERE
    ($scope != 'village' OR r.village_id = $village_id)
    AND (
      $scope != 'unread'
      OR NOT EXISTS (
        SELECT 1 FROM report_tags rt
        WHERE rt.report_id = r.id
          AND rt.report_tag_id = (SELECT id FROM report_tag_ids WHERE tag = 'read')
      )
    )
    AND (
      $scope != 'archived'
      OR EXISTS (
        SELECT 1 FROM report_tags rt
        WHERE rt.report_id = r.id
          AND rt.report_tag_id = (SELECT id FROM report_tag_ids WHERE tag = 'archived')
      )
    )
    AND (
      $type_count = 0
      OR ($include_battle = 1 AND r.type_id = (SELECT id FROM report_type_ids WHERE report_type = 'battle'))
      OR ($include_adventure = 1 AND r.type_id = (SELECT id FROM report_type_ids WHERE report_type = 'adventure'))
      OR ($include_trade = 1 AND r.type_id = (SELECT id FROM report_type_ids WHERE report_type = 'trade'))
      OR ($include_movement = 1 AND r.type_id = (SELECT id FROM report_type_ids WHERE report_type = 'movement'))
      OR ($include_hunting_party = 1 AND r.type_id = (SELECT id FROM report_type_ids WHERE report_type = 'huntingParty'))
      OR ($include_gathering_expedition = 1 AND r.type_id = (SELECT id FROM report_type_ids WHERE report_type = 'gatheringExpedition'))
      OR ($include_scouting = 1 AND r.type_id = (SELECT id FROM report_type_ids WHERE report_type = 'scouting'))
    )
    AND (
      $exclude_no_loss = 0
      OR rty.report_type != 'battle'
      OR roi.report_outcome != 'attackerNoLoss'
    )
    AND (
      $exclude_own_trades = 0
      OR rty.report_type != 'trade'
      OR trade_origin_v.player_id != trade_target_v.player_id
    )
  ORDER BY r.timestamp DESC;
`;

export const selectReportTypeQuery = `
  SELECT
    rty.report_type AS type
  FROM reports r
  JOIN report_type_ids rty ON rty.id = r.type_id
  WHERE r.id = $report_id;
`;

const reportCte = `
  WITH report AS MATERIALIZED (
    SELECT
      r.id, r.village_id, r.timestamp,
      rty.report_type AS type,
      roi.report_outcome AS outcome,
      COALESCE((
        SELECT json_group_array(rti.tag)
        FROM report_tags rt
        JOIN report_tag_ids rti ON rti.id = rt.report_tag_id
        WHERE rt.report_id = r.id
      ), '[]') AS tags_json
    FROM reports r
    JOIN report_type_ids rty ON rty.id = r.type_id
    JOIN report_outcome_ids roi ON roi.id = r.report_outcome_id
    WHERE r.id = $report_id
  )
`;

const reportColumns = `
  r.id, r.village_id, r.timestamp,
  r.type, r.outcome, r.tags_json
`;

export const selectBattleReportQuery = `
  ${reportCte}
  SELECT
    ${reportColumns},
    b.is_raid AS battle_is_raid,
    origin_v.name AS battle_origin_name,
    origin_t.x AS battle_origin_x,
    origin_t.y AS battle_origin_y,
    CASE
      WHEN target_v.id IS NOT NULL THEN target_v.name
      WHEN target_o.id IS NOT NULL AND target_o.village_id IS NOT NULL THEN 'Occupied oasis'
      WHEN target_o.id IS NOT NULL THEN 'Unoccupied oasis'
      ELSE ''
    END AS battle_target_name,
    target_t.x AS battle_target_x,
    target_t.y AS battle_target_y,
    b.id AS battle_id,
    b.origin_tile_id, b.target_tile_id,
    b.loot_wood, b.loot_clay, b.loot_iron, b.loot_wheat,
    b.can_attacker_see_full_report,
    b.attacker_points, b.defender_points,
    bp.id AS participant_id,
    bp.player_id AS participant_player_id,
    bp.tile_id AS participant_tile_id,
    CASE WHEN bp.tile_id = b.origin_tile_id THEN 'attacker' ELSE 'defender' END AS participant_role,
    COALESCE(participant_tribe.tribe, 'nature') AS participant_tribe,
    CASE WHEN bp.tile_id NOT IN (b.origin_tile_id, b.target_tile_id) THEN 1 ELSE 0 END AS participant_is_reinforcement,
    COALESCE(participant_p.name, oasis_p.name, 'Nature') AS participant_player_name,
    COALESCE(participant_p.slug, oasis_p.slug) AS participant_player_slug,
    participant_v.id AS participant_village_id,
    CASE
      WHEN participant_v.id IS NOT NULL THEN participant_v.name
      WHEN participant_o.village_id IS NOT NULL THEN 'Occupied oasis'
      ELSE 'Unoccupied oasis'
    END AS participant_location_name,
    participant_t.x AS participant_x,
    participant_t.y AS participant_y,
    participant_ui.unit AS participant_unit_id,
    bru.amount_before AS participant_amount_before,
    bru.amount_after AS participant_amount_after,
    bru.amount_hospitalized AS participant_amount_hospitalized,
    bru.amount_imprisoned AS participant_amount_imprisoned
  FROM report r
  JOIN battle_reports b ON b.report_id = r.id
  JOIN tiles origin_t ON origin_t.id = b.origin_tile_id
  LEFT JOIN villages origin_v ON origin_v.tile_id = origin_t.id
  JOIN tiles target_t ON target_t.id = b.target_tile_id
  LEFT JOIN villages target_v ON target_v.tile_id = target_t.id
  LEFT JOIN oasis target_o ON target_o.id = (
    SELECT MIN(id) FROM oasis WHERE tile_id = target_t.id
  )
  JOIN battle_report_participants bp ON bp.battle_id = b.id
  JOIN tiles participant_t ON participant_t.id = bp.tile_id
  LEFT JOIN villages participant_v ON participant_v.tile_id = participant_t.id
  LEFT JOIN players participant_p ON participant_p.id = participant_v.player_id
  LEFT JOIN tribe_ids participant_tribe ON participant_tribe.id = participant_p.tribe_id
  LEFT JOIN oasis participant_o ON participant_o.id = (
    SELECT MIN(id) FROM oasis WHERE tile_id = participant_t.id
  )
  LEFT JOIN villages oasis_v ON oasis_v.id = participant_o.village_id
  LEFT JOIN players oasis_p ON oasis_p.id = oasis_v.player_id
  LEFT JOIN battle_report_units bru ON bru.battle_participant_id = bp.id
  LEFT JOIN unit_ids participant_ui ON participant_ui.id = bru.unit_id
  ;
`;

export const selectBattleReportDamagedBuildingsQuery = `
  SELECT
    bi.building AS buildingId,
    brb.level_before AS levelBefore,
    brb.level_after AS levelAfter
  FROM battle_report_buildings brb
  JOIN building_ids bi ON bi.id = brb.building_id
  WHERE brb.report_id = $report_id;
`;

export const selectAdventureReportQuery = `
  ${reportCte}
  SELECT
    ${reportColumns},
    ar.adventure_id, ar.item_id, ar.item_amount, ar.health_before, ar.health_after,
    p.name AS adventure_origin_player_name,
    p.slug AS adventure_origin_player_slug,
    v.name AS adventure_origin_village_name,
    t.x AS adventure_origin_x,
    t.y AS adventure_origin_y,
    ti.tribe AS adventure_origin_tribe
  FROM report r
  JOIN hero_adventure_reports ar ON ar.report_id = r.id
  JOIN villages v ON v.id = r.village_id
  JOIN players p ON p.id = v.player_id
  JOIN tiles t ON t.id = v.tile_id
  JOIN tribe_ids ti ON ti.id = p.tribe_id
  ;
`;

export const selectMovementReportQuery = `
  ${reportCte}
  SELECT
    ${reportColumns},
    mr.id AS movement_id, mr.movement_type,
    origin_tribe.tribe AS movement_tribe,
    mr.origin_tile_id AS movement_origin_tile_id,
    mr.target_tile_id AS movement_target_tile_id,
    origin_p.name AS movement_origin_player_name,
    origin_p.slug AS movement_origin_player_slug,
    origin_v.name AS movement_origin_name,
    origin_t.x AS movement_origin_x, origin_t.y AS movement_origin_y,
    target_p.name AS movement_target_player_name,
    target_p.slug AS movement_target_player_slug,
    COALESCE(target_v.name, CASE WHEN target_o.id IS NOT NULL THEN 'Oasis' END) AS movement_target_name,
    target_t.x AS movement_target_x, target_t.y AS movement_target_y
  FROM report r
  JOIN movement_reports mr ON mr.report_id = r.id
  JOIN tiles origin_t ON origin_t.id = mr.origin_tile_id
  JOIN villages origin_v ON origin_v.tile_id = origin_t.id
  JOIN players origin_p ON origin_p.id = origin_v.player_id
  JOIN tribe_ids origin_tribe ON origin_tribe.id = origin_p.tribe_id
  JOIN tiles target_t ON target_t.id = mr.target_tile_id
  LEFT JOIN villages target_v ON target_v.tile_id = target_t.id
  LEFT JOIN players target_p ON target_p.id = target_v.player_id
  LEFT JOIN oasis target_o ON target_o.id = (
    SELECT MIN(id) FROM oasis WHERE tile_id = target_t.id
  );
`;

export const selectTradeReportQuery = `
  ${reportCte}
  SELECT
    ${reportColumns},
    tr.id AS trade_id,
    tr.origin_tile_id AS trade_origin_tile_id,
    tr.target_tile_id AS trade_target_tile_id,
    origin_p.name AS trade_origin_player_name,
    origin_p.slug AS trade_origin_player_slug,
    origin_v.name AS trade_origin_name,
    origin_t.x AS trade_origin_x, origin_t.y AS trade_origin_y,
    target_p.name AS trade_target_player_name,
    target_p.slug AS trade_target_player_slug,
    target_v.name AS trade_target_name,
    target_t.x AS trade_target_x, target_t.y AS trade_target_y,
    tr.wood AS trade_wood, tr.clay AS trade_clay,
    tr.iron AS trade_iron, tr.wheat AS trade_wheat
  FROM report r
  JOIN trade_reports tr ON tr.report_id = r.id
  JOIN tiles origin_t ON origin_t.id = tr.origin_tile_id
  JOIN villages origin_v ON origin_v.tile_id = origin_t.id
  JOIN players origin_p ON origin_p.id = origin_v.player_id
  JOIN tiles target_t ON target_t.id = tr.target_tile_id
  JOIN villages target_v ON target_v.tile_id = target_t.id
  JOIN players target_p ON target_p.id = target_v.player_id
  ;
`;

export const selectHuntingPartyReportQuery = `
  ${reportCte}
  SELECT
    ${reportColumns},
    hpr.id AS expedition_id,
    'nature' AS expedition_tribe,
    v.name AS expedition_village_name,
    t.x AS expedition_village_x,
    t.y AS expedition_village_y,
    NULL AS loot_wood, NULL AS loot_clay, NULL AS loot_iron, NULL AS loot_wheat
  FROM report r
  JOIN hunting_party_reports hpr ON hpr.report_id = r.id
  JOIN tiles t ON t.id = hpr.village_tile_id
  JOIN villages v ON v.tile_id = t.id;
`;

export const selectGatheringExpeditionReportQuery = `
  ${reportCte}
  SELECT
    ${reportColumns},
    ger.id AS expedition_id,
    ti.tribe AS expedition_tribe,
    v.name AS expedition_village_name,
    t.x AS expedition_village_x,
    t.y AS expedition_village_y,
    ger.loot_wood, ger.loot_clay, ger.loot_iron, ger.loot_wheat
  FROM report r
  JOIN gathering_expedition_reports ger ON ger.report_id = r.id
  JOIN tribe_ids ti ON ti.id = ger.tribe_id
  JOIN tiles t ON t.id = ger.village_tile_id
  JOIN villages v ON v.tile_id = t.id;
`;

export const selectScoutingReportQuery = `
  ${reportCte}
  SELECT ${reportColumns}, sr.id AS scouting_id, sr.perspective,
    sr.successful, sr.scouting_target, sr.wood, sr.clay, sr.iron, sr.wheat,
    origin_p.name AS origin_player_name, origin_p.slug AS origin_player_slug,
    origin_v.name AS origin_name, origin_t.x AS origin_x, origin_t.y AS origin_y,
    target_p.name AS target_player_name, target_p.slug AS target_player_slug,
    target_v.name AS target_name, target_t.x AS target_x, target_t.y AS target_y,
    origin_tribe.tribe AS attacker_tribe, target_tribe.tribe AS defender_tribe
  FROM report r JOIN scouting_reports sr ON sr.report_id = r.id
  JOIN tiles origin_t ON origin_t.id = sr.origin_tile_id
  JOIN villages origin_v ON origin_v.tile_id = origin_t.id
  JOIN players origin_p ON origin_p.id = origin_v.player_id
  JOIN tribe_ids origin_tribe ON origin_tribe.id = origin_p.tribe_id
  JOIN tiles target_t ON target_t.id = sr.target_tile_id
  JOIN villages target_v ON target_v.tile_id = target_t.id
  JOIN players target_p ON target_p.id = target_v.player_id
  JOIN tribe_ids target_tribe ON target_tribe.id = target_p.tribe_id;
`;

export const deleteReportQuery = `
  DELETE FROM reports
  WHERE id IN (SELECT value FROM json_each($report_ids))
`;

export const insertReportTagsQuery = `
  INSERT OR IGNORE INTO report_tags (report_id, report_tag_id)
  SELECT r.id, rti.id
  FROM json_each($report_ids) report_ids
  JOIN reports r ON r.id = report_ids.value
  CROSS JOIN json_each($tags) tag_updates
  JOIN report_tag_ids rti ON rti.tag = tag_updates.key
  WHERE tag_updates.value = 1
`;

export const deleteReportTagsQuery = `
  DELETE FROM report_tags
  WHERE (report_id, report_tag_id) IN (
    SELECT r.id, rti.id
    FROM json_each($report_ids) report_ids
    JOIN reports r ON r.id = report_ids.value
    CROSS JOIN json_each($tags) tag_updates
    JOIN report_tag_ids rti ON rti.tag = tag_updates.key
    WHERE tag_updates.value = 0
  )
`;
