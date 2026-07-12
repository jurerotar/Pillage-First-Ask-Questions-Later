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
    battle_units bu
    JOIN unit_ids ui ON bu.unit_id = ui.id
  WHERE
    bu.report_id = $report_id;
`;

export const selectBattleParticipantsByReportQuery = `
  SELECT
    p.id,
    p.role,
    t.tribe,
    p.is_reinforcement
  FROM
    battle_participants p
    JOIN tribe_ids t ON p.tribe_id = t.id
  WHERE
    p.report_id = $report_id;
`;

export const selectBattleByReportQuery = `
  SELECT
    attacking_village_id,
    defending_village_id,
    defending_oasis_id,
    loot_wood,
    loot_clay,
    loot_iron,
    loot_wheat,
    can_attacker_see_full_report,
    attacker_points,
    defender_points
  FROM
    battles
  WHERE
    report_id = $report_id;
`;
