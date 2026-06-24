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
    attacking_player_name,
    attacking_player_slug,
    defending_player_name,
    defending_player_slug,
    origin_village_name,
    origin_village_x,
    origin_village_y,
    target_village_name,
    target_village_x,
    target_village_y,
    loot_wood,
    loot_clay,
    loot_iron,
    loot_wheat,
    total_carry_capacity,
    did_attacker_win,
    can_attacker_see_full_report,
    attacker_points,
    attacker_supply_before,
    attacker_supply_lost,
    attacker_resources_lost,
    defender_points,
    defender_supply_before,
    defender_supply_lost,
    defender_resources_lost
  FROM
    battles
  WHERE
    report_id = $report_id;
`;
