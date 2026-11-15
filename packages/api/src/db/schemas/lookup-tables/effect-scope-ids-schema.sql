CREATE TABLE effect_scope_ids
(
  id INTEGER PRIMARY KEY,
  scope TEXT NOT NULL UNIQUE CHECK (scope IN ('server', 'global', 'local'))
);
