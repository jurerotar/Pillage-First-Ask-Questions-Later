CREATE TABLE quests
(
  id INTEGER PRIMARY KEY,
  quest_id TEXT NOT NULL,
  completed_at INTEGER,
  collected_at INTEGER,
  village_id INTEGER,
  scope TEXT GENERATED ALWAYS AS (
    CASE WHEN village_id IS NOT NULL THEN 'village' ELSE 'global' END
  ) VIRTUAL,

  CONSTRAINT fk_quests_village FOREIGN KEY (village_id)
    REFERENCES villages (id) ON DELETE SET NULL
) STRICT;

CREATE INDEX idx_quests_village_id ON quests (village_id);
CREATE INDEX idx_quests_quest_id ON quests (quest_id);
