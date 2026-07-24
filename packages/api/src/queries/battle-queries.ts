export const selectBattleParticipantInfoByVillageQuery = `
  SELECT
    v.name as village_name,
    p.id as player_id,
    p.name as player_name,
    p.slug as player_slug,
    x,
    y
  FROM
    villages v
    JOIN players p ON v.player_id = p.id
    RIGHT JOIN tiles t ON v.tile_id = t.id
  WHERE
    t.id = $tile_id
`;

export const selectBattleParticipantInfoByOasisQuery = `
  SELECT
    p.id AS player_id,
    p.name AS player_name,
    p.slug AS player_slug,
  	v.id as village_id,
  	v.name as village_name,
    t.x,
    t.y
  FROM
    tiles t
    JOIN oasis o ON t.id = o.tile_id
    LEFT JOIN villages v ON o.village_id = v.id
    LEFT JOIN players p ON v.player_id = p.id
  WHERE
    o.id = $oasis_id
  LIMIT 1
`;

export const selectUnitImprovementByTileQuery = `
  SELECT
    ui.unit as unit_id,
    im.level
  FROM
    villages v
    JOIN unit_improvements im on v.player_id = im.player_id
    JOIN unit_ids ui on im.unit_id = ui.id
  WHERE
    tile_id = $tile_id
`;

export const selectBattleUnitsByReportQuery = `
  SELECT
    bu.battle_participant_id,
    ui.unit as unit_id,
    bu.amount_before,
    bu.amount_after
  FROM
    battle_report_units bu
    JOIN battle_report_participants bp ON bu.battle_participant_id = bp.id
    JOIN battle_reports b ON bp.battle_id = b.id
    JOIN unit_ids ui ON bu.unit_id = ui.id
  WHERE
    b.report_id = $report_id;
`;

export const selectBattleParticipantsByReportQuery = `
  SELECT
    p.id,
    p.player_id,
    p.tile_id,
    CASE
      WHEN p.tile_id = b.origin_tile_id THEN 'attacker'
      ELSE 'defender'
      END AS role,
    COALESCE(t.tribe, 'nature') AS tribe,
    CASE
      WHEN p.tile_id != b.origin_tile_id AND p.tile_id != b.target_tile_id THEN 1
      ELSE 0
      END AS is_reinforcement
  FROM
    battle_report_participants p
    JOIN battle_reports b ON p.battle_id = b.id
    LEFT JOIN players pl ON p.player_id = pl.id
    LEFT JOIN tribe_ids t ON pl.tribe_id = t.id
  WHERE
    b.report_id = $report_id;
`;

export const selectPlayerIdByVillageTileQuery = `
  SELECT player_id
  FROM villages
  WHERE tile_id = $tile_id;
`;

export const selectBattleByReportQuery = `
  SELECT
    id,
    origin_tile_id,
    target_tile_id,
    is_raid,
    loot_wood,
    loot_clay,
    loot_iron,
    loot_wheat,
    can_attacker_see_full_report,
    attacker_points,
    defender_points
  FROM
    battle_reports
  WHERE
    report_id = $report_id;
`;
