export const selectVillageQuestsQuery = `
  SELECT quest_id, scope, collected_at, completed_at, village_id
  FROM
    (
      SELECT quest_id, scope, collected_at, completed_at, village_id
      FROM
        quests
      WHERE
        player_id = $player_id AND village_id = $village_id

      UNION ALL

      SELECT quest_id, scope, collected_at, completed_at, village_id
      FROM
        quests
      WHERE
        player_id = $player_id AND village_id IS NULL
      ) AS q;
`;

export const selectCollectableQuestCountQuery = `
  -- Separate seeks use the existing (player_id, village_id, quest_id) index.
  SELECT
    (SELECT COUNT(*) FROM quests
      WHERE player_id = $player_id AND village_id = $village_id
        AND completed_at IS NOT NULL AND collected_at IS NULL)
    +
    (SELECT COUNT(*) FROM quests
      WHERE player_id = $player_id AND village_id IS NULL
        AND completed_at IS NOT NULL AND collected_at IS NULL) AS COUNT;
`;

export const collectQuestQuery = `
  UPDATE quests
  SET
    collected_at = $collected_at
  WHERE
    id = COALESCE(
      (SELECT id FROM quests
        WHERE player_id = $player_id AND village_id = $village_id
          AND quest_id = $quest_id LIMIT 1),
      (SELECT id FROM quests
        WHERE player_id = $player_id AND village_id IS NULL
          AND quest_id = $quest_id LIMIT 1)
    )
    AND completed_at IS NOT NULL
    AND collected_at IS NULL
    AND EXISTS (SELECT 1 FROM villages WHERE id = $village_id AND player_id = $player_id)
  RETURNING id;
`;
