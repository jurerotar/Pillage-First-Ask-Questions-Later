import { getHunterLodgeCatchableAnimals } from '@pillage-first/game-assets/utils/hunters-lodge';

// Strip the numeric milestone, its optional minus sign, and the separator.
const questGroupExpression = "rtrim(rtrim(q.quest_id, '0123456789.'), '-')";
const questMilestoneExpression = `substr(q.quest_id, LENGTH(${questGroupExpression}) + 2)`;

export const questCatchableAnimalIds = JSON.stringify(
  getHunterLodgeCatchableAnimals(5),
);

// Read quest progress and completion from gameplay state or durable history.
// Report generation is optional, and reports can be deleted or pruned.
const selectAdventureCountQuery = `
  SELECT COALESCE(MAX(ha.completed), 0)
  FROM hero_adventures ha
    JOIN heroes h ON h.id = ha.hero_id
  WHERE h.player_id = $player_id
`;

// The GLOB narrows the quest ID index range before the exact group check.
export const completeAdventureQuestsQuery = `
  UPDATE quests AS q
  SET completed_at = $completed_at
  WHERE q.player_id = $player_id
    AND q.village_id IS NULL
    AND q.completed_at IS NULL
    AND q.quest_id GLOB 'adventureCount-[0-9]*'
    AND ${questGroupExpression} = 'adventureCount'
    AND (${selectAdventureCountQuery}) >= CAST(${questMilestoneExpression} AS INTEGER);
`;

const selectCelebrationCountQuery = `
  SELECT celebrations_held
  FROM culture_points
  WHERE player_id = $player_id
`;

export const completeCelebrationQuestsQuery = `
  UPDATE quests AS q
  SET completed_at = $completed_at
  WHERE q.player_id = $player_id
    AND q.village_id IS NULL
    AND q.completed_at IS NULL
    AND q.quest_id GLOB 'celebrationCount-*'
    AND ${questGroupExpression} = 'celebrationCount'
    AND (${selectCelebrationCountQuery}) >= CAST(${questMilestoneExpression} AS INTEGER);
`;

const selectQueuedTroopCountsBySourceQuery = `
  WITH healing_buildings AS (
    SELECT id, building FROM building_ids
    WHERE building IN ('HOSPITAL', 'ASCLEPEION')
  )
  SELECT ui.unit, SUM(uth.amount) AS amount
  FROM unit_training_history uth
    JOIN unit_ids ui ON ui.id = uth.unit_id
    JOIN villages v ON v.id = uth.village_id
  WHERE v.player_id = $player_id
    AND uth.building_id NOT IN (SELECT id FROM healing_buildings)
  GROUP BY ui.unit

  UNION ALL

  SELECT JSON_EXTRACT(e.meta, '$.unitId') AS unit, COUNT(*) AS amount
  FROM events e
    JOIN villages v ON v.id = e.village_id
  WHERE e.type = 'troopTraining' AND v.player_id = $player_id
    AND COALESCE(JSON_EXTRACT(e.meta, '$.buildingId'), '') NOT IN (
      SELECT building FROM healing_buildings
    )
  GROUP BY unit
`;

const selectQueuedTroopCountsQuery = `
  SELECT unit, SUM(amount) AS amount
  FROM (${selectQueuedTroopCountsBySourceQuery})
  GROUP BY unit
`;

export const completeQueuedTroopQuestsQuery = `
  UPDATE quests AS q
  SET completed_at = $completed_at
  FROM (
    SELECT
      COALESCE(SUM(amount), 0) AS total_amount,
      COALESCE(SUM(amount) FILTER (WHERE unit = $unit_id), 0) AS unit_amount
    FROM (${selectQueuedTroopCountsBySourceQuery})
  ) AS training_counts
  WHERE q.player_id = $player_id
    AND q.village_id IS NULL
    AND q.completed_at IS NULL
    AND q.quest_id GLOB 'queuedTroopCount*'
    AND ${questGroupExpression} IN ('queuedTroopCount', 'queuedTroopCountById-' || $unit_id)
    AND ${questMilestoneExpression} GLOB '[0-9]*'
    AND CASE ${questGroupExpression}
      WHEN 'queuedTroopCount' THEN training_counts.total_amount
      ELSE training_counts.unit_amount
    END >= CAST(${questMilestoneExpression} AS INTEGER);
`;

const selectCapturedAnimalCountsQuery = `
  SELECT ui.unit, hch.amount
  FROM hunting_capture_history hch
    JOIN unit_ids ui ON ui.id = hch.unit_id
  WHERE hch.player_id = $player_id
`;

export const completeCaptureAnimalByIdQuestsQuery = `
  UPDATE quests AS q
  SET completed_at = $completed_at
  WHERE q.player_id = $player_id
    AND q.village_id IS NULL
    AND q.completed_at IS NULL
    AND q.quest_id GLOB $quest_pattern
    AND ${questGroupExpression} = 'captureAnimalCountById-' || $unit_id
    AND COALESCE((
      SELECT amount FROM (${selectCapturedAnimalCountsQuery}) WHERE unit = $unit_id
    ), 0) >= CAST(${questMilestoneExpression} AS INTEGER);
`;

const selectCapturedAnimalKindCountQuery = `
  SELECT COUNT(*)
  FROM (${selectCapturedAnimalCountsQuery})
  WHERE amount > 0 AND unit IN (SELECT value FROM json_each($unit_ids))
`;

export const completeCaptureAnimalKindQuestsQuery = `
  UPDATE quests AS q
  SET completed_at = $completed_at
  WHERE q.player_id = $player_id
    AND q.village_id IS NULL
    AND q.completed_at IS NULL
    AND q.quest_id GLOB 'captureAnimalKindCount-[0-9]*'
    AND ${questGroupExpression} = 'captureAnimalKindCount'
    AND (${selectCapturedAnimalKindCountQuery}) >= CAST(${questMilestoneExpression} AS INTEGER);
`;

export const selectGatheredResourceCountQuery = `
  SELECT COALESCE((
    SELECT amount FROM gathering_resource_totals WHERE player_id = $player_id
  ), 0)
`;

export const completeGatheredResourceQuestsQuery = `
  UPDATE quests AS q
  SET completed_at = $completed_at
  FROM gathering_resource_totals AS totals
  WHERE q.player_id = totals.player_id
    AND q.village_id IS NULL
    AND q.completed_at IS NULL
    AND q.quest_id GLOB 'gatheredResourceCount-[0-9]*'
    AND ${questGroupExpression} = 'gatheredResourceCount'
    AND totals.amount >= CAST(${questMilestoneExpression} AS INTEGER)
`;

const selectBattleQuestProgressQuery = `
  WITH enemy_casualties AS (
    SELECT unit_id, amount FROM enemy_casualty_totals
    WHERE player_id = $player_id
  )
  SELECT 'killCount' AS quest_group, COALESCE(SUM(amount), 0) AS progress
  FROM enemy_casualties
  UNION ALL
  SELECT 'unitKillCount-' || ui.unit, COALESCE(ec.amount, 0)
  FROM unit_ids ui LEFT JOIN enemy_casualties ec ON ec.unit_id = ui.id
`;

export const completeBattleQuestsQuery = `
  WITH battle_progress AS MATERIALIZED (${selectBattleQuestProgressQuery})
  UPDATE quests AS q
  SET completed_at = $completed_at
  FROM battle_progress
  WHERE q.player_id = $player_id
    AND q.village_id IS NULL
    AND q.completed_at IS NULL
    AND battle_progress.progress > 0
    AND ${questGroupExpression} = battle_progress.quest_group
    AND ${questMilestoneExpression} GLOB '[0-9]*'
    AND battle_progress.progress >= CAST(${questMilestoneExpression} AS INTEGER);
`;

const selectQuestProgressQuery = `
  WITH
    trained_units AS (${selectQueuedTroopCountsQuery}),
    captured_animals AS (${selectCapturedAnimalCountsQuery}),
    building_levels AS (
      SELECT bi.building, COALESCE(MAX(bf.level), 0) AS highest,
        COALESCE(MIN(bf.level), 0) AS lowest
      FROM building_ids bi
        LEFT JOIN building_fields bf ON bf.building_id = bi.id
          AND bf.village_id = $village_id
      GROUP BY bi.id
    )
  SELECT 'adventureCount' AS quest_group, (${selectAdventureCountQuery}) AS progress
  UNION ALL
  SELECT 'celebrationCount', COALESCE((${selectCelebrationCountQuery}), 0)
  UNION ALL
  SELECT 'queuedTroopCount', COALESCE(SUM(amount), 0) FROM trained_units
  UNION ALL
  SELECT 'queuedTroopCountById-' || ui.unit, COALESCE(tu.amount, 0)
  FROM unit_ids ui LEFT JOIN trained_units tu ON tu.unit = ui.unit
  UNION ALL
  SELECT quest_group, progress FROM (${selectBattleQuestProgressQuery})
  UNION ALL
  SELECT 'captureAnimalCountById-' || ui.unit, COALESCE(ca.amount, 0)
  FROM unit_ids ui LEFT JOIN captured_animals ca ON ca.unit = ui.unit
  UNION ALL
  SELECT 'captureAnimalKindCount', (${selectCapturedAnimalKindCountQuery})
  UNION ALL
  SELECT 'gatheredResourceCount', (${selectGatheredResourceCountQuery})
  UNION ALL
  SELECT 'oneOf-' || building, highest FROM building_levels
  UNION ALL
  SELECT 'every-' || building, lowest FROM building_levels
`;

export const selectVillageQuestsQuery = `
  WITH
    selected_quests AS (
      SELECT quest_id, scope, collected_at, completed_at, village_id
      FROM quests
      WHERE player_id = $player_id AND village_id = $village_id

      UNION ALL

      SELECT quest_id, scope, collected_at, completed_at, village_id
      FROM quests
      WHERE player_id = $player_id AND village_id IS NULL
    ),
    quest_progress AS MATERIALIZED (${selectQuestProgressQuery})
  SELECT q.quest_id, q.scope, q.collected_at, q.completed_at, q.village_id, p.progress
  FROM selected_quests q
    LEFT JOIN quest_progress p ON p.quest_group = ${questGroupExpression};
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
