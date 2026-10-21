CREATE TABLE effects
(
  id INTEGER PRIMARY KEY,
  effect_id INTEGER NOT NULL,
  value REAL NOT NULL,
  type_id INTEGER NOT NULL,
  scope_id INTEGER NOT NULL,
  source_id INTEGER NOT NULL,
  tile_id INTEGER,
  source_specifier INTEGER,

  FOREIGN KEY (effect_id) REFERENCES effect_ids (id),
  FOREIGN KEY (type_id) REFERENCES effect_type_ids (id),
  FOREIGN KEY (scope_id) REFERENCES effect_scope_ids (id),
  FOREIGN KEY (source_id) REFERENCES effect_source_ids (id),
  FOREIGN KEY (tile_id) REFERENCES tiles (id) ON DELETE CASCADE ON UPDATE CASCADE
);
