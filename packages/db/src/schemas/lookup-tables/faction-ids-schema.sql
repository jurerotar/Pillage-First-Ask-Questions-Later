CREATE TABLE faction_ids
(
  id INTEGER PRIMARY KEY,
  faction TEXT NOT NULL UNIQUE CHECK (faction IN ('player', 'npc1', 'npc2', 'npc3', 'npc4', 'npc5', 'npc6', 'npc7', 'npc8'))
) STRICT;

CREATE INDEX idx_faction_ids_faction ON faction_ids(faction);
