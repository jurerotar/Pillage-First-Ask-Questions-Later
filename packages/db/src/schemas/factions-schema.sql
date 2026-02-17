CREATE TABLE factions
(
  id INTEGER PRIMARY KEY,
  faction_id INTEGER NOT NULL,

  FOREIGN KEY (faction_id) REFERENCES faction_ids (id)
) STRICT;
