export const selectPlayerUnitImprovementsQuery = `
  SELECT
    ui.unit AS unit_id,
    u.level
  FROM
    unit_improvements u
      JOIN unit_ids ui ON ui.id = u.unit_id
  WHERE
    u.player_id = $player_id;
`;

export const selectVillageResearchedUnitsQuery = `
  SELECT
    ui.unit AS unit_id,
    ur.village_id
  FROM
    unit_research ur
      JOIN unit_ids ui ON ui.id = ur.unit_id
  WHERE
    ur.village_id = $village_id;
`;
