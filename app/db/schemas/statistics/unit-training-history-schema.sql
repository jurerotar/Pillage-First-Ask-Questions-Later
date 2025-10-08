CREATE TABLE unit_training_history
(
  id INTEGER PRIMARY KEY,
  village_id INTEGER NOT NULL,
  unit_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  timestamp INTEGER NOT NULL,

  FOREIGN KEY (village_id) REFERENCES villages (id)
) STRICT;
