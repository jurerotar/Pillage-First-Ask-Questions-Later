CREATE TABLE quest_rewards
(
  id        INTEGER PRIMARY KEY,
  quest_id  INTEGER NOT NULL,
  item_id   INTEGER NOT NULL,
  amount    INTEGER NOT NULL CHECK (amount > 0),

  CONSTRAINT fk_rewards_quest FOREIGN KEY (quest_id)
    REFERENCES quests (quest_id) ON DELETE CASCADE
) STRICT;

CREATE INDEX idx_rewards_quest_id ON quest_rewards (quest_id);
