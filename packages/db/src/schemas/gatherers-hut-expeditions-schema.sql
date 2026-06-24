CREATE TABLE gatherers_hut_expeditions
(
  village_id INTEGER PRIMARY KEY,
  completed INTEGER NOT NULL DEFAULT 0 CHECK (completed >= 0),

  FOREIGN KEY (village_id) REFERENCES villages (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) STRICT;
