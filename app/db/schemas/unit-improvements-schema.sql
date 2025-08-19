CREATE TABLE unit_improvements
(
  unit_id TEXT PRIMARY KEY NOT NULL,
  level INTEGER NOT NULL,

  UNIQUE (unit_id)
);
