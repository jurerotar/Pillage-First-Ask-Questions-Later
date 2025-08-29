CREATE TABLE unit_improvements
(
  unit_id TEXT PRIMARY KEY NOT NULL,
  level INTEGER NOT NULL CHECK (level >= 0)
);
