CREATE TABLE factions
(
  id INTEGER PRIMARY KEY,
  faction TEXT NOT NULL CHECK (faction IN ('player', 'npc1', 'npc2', 'npc3', 'npc4', 'npc5', 'npc6', 'npc7', 'npc8'))
) STRICT;
