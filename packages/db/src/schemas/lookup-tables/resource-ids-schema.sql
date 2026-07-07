CREATE TABLE resource_ids
(
  id INTEGER PRIMARY KEY,
  resource TEXT NOT NULL UNIQUE CHECK (resource IN ('wood', 'clay', 'iron', 'wheat'))
) STRICT;

CREATE INDEX idx_resource_ids_resource ON resource_ids(resource);
