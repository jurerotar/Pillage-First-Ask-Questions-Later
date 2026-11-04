export const selectPlayerFactionReputationsQuery = `
  SELECT
    fi.faction,
    fr.reputation
  FROM
    faction_reputation fr
      JOIN faction_ids fi ON fr.target_faction_id = fi.id
  WHERE
    fr.player_id = $player_id;
`;
