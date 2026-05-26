export const selectVillageQuestsQuery = `
  SELECT quest_id, scope, collected_at, completed_at, village_id
  FROM
    (
      SELECT quest_id, scope, collected_at, completed_at, village_id
      FROM
        quests
      WHERE
        village_id = $village_id

      UNION ALL

      SELECT quest_id, scope, collected_at, completed_at, village_id
      FROM
        quests
      WHERE
        village_id IS NULL
      ) AS q;
`;

export const selectCollectableQuestCountQuery = `
  SELECT COUNT(*) AS COUNT
  FROM
    quests
  WHERE
    completed_at IS NOT NULL
    AND collected_at IS NULL
    AND (
      village_id = $village_id
      OR village_id IS NULL
    );
`;

export const collectQuestQuery = `
  UPDATE quests
  SET
    collected_at = $collected_at
  WHERE
    id = (
      SELECT id
      FROM
        quests
      WHERE
        quest_id = $quest_id
        AND (village_id = $village_id OR village_id IS NULL)
      ORDER BY (village_id = $village_id) DESC, (village_id IS NULL) DESC
      LIMIT 1
    );
`;
