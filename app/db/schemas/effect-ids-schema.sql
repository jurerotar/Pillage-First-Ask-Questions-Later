CREATE TABLE effect_ids
(
  id INTEGER PRIMARY KEY,
  effect TEXT NOT NULL
) STRICT;

CREATE INDEX idx_effect_ids_effect ON effect_ids(effect);
