export const selectIsUnitResearchedQuery = `
  SELECT
    EXISTS
    (
      SELECT 1
      FROM
        unit_research
      WHERE
        village_id = $village_id
        AND unit_id = (
          SELECT id
          FROM
            unit_ids
          WHERE
            unit = $unit_id
          )
      ) AS is_researched;
`;
