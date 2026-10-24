CREATE TABLE effect_source_ids
(
  id INTEGER PRIMARY KEY,
  source TEXT NOT NULL UNIQUE CHECK (source IN ('hero', 'oasis', 'artifact', 'building', 'tribe', 'server', 'troops'))
);
