CREATE TABLE factions
(
  id TEXT PRIMARY KEY CHECK (id IN ('player', 'npc1', 'npc2', 'npc3', 'npc4', 'npc5', 'npc6', 'npc7', 'npc8')),
  name TEXT NOT NULL
) STRICT;
