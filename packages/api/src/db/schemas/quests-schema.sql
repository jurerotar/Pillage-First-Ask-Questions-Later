CREATE TABLE quests
(
  id INTEGER PRIMARY KEY,
  quest_id TEXT NOT NULL,
  player_id INTEGER NOT NULL REFERENCES players (id) ON DELETE CASCADE,
  completed_at INTEGER,
  collected_at INTEGER,
  village_id INTEGER,
  scope TEXT GENERATED ALWAYS AS (
    CASE WHEN village_id IS NOT NULL THEN 'village' ELSE 'global' END
  ) VIRTUAL,

  CONSTRAINT fk_quests_village FOREIGN KEY (village_id)
    REFERENCES villages (id) ON DELETE CASCADE
) STRICT;

CREATE INDEX idx_quests_village_id_notnull
  ON quests(village_id)
  WHERE village_id IS NOT NULL;

CREATE INDEX idx_quests_player_village_quest ON quests (player_id, village_id, quest_id);
