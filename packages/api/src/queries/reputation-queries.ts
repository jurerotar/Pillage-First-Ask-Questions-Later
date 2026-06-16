export const selectPlayerFactionReputationsQuery = `
  SELECT
    fi.faction,
    fr.reputation
  FROM
    faction_reputation fr
      JOIN faction_ids fi ON fr.target_faction_id = fi.id
  WHERE
    fr.source_faction_id = (
      SELECT faction_id
      FROM
        players
      WHERE
        id = $player_id
      );
`;
