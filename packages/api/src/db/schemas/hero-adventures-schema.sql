CREATE TABLE hero_adventures
(
  hero_id INTEGER PRIMARY KEY,
  available INTEGER NOT NULL CHECK (available >= 0),
  last_updated_at INTEGER NOT NULL,
  completed INTEGER NOT NULL CHECK (completed >= 0),

  FOREIGN KEY (hero_id) REFERENCES heroes (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) STRICT;
