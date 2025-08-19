CREATE TABLE factions
(
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (id IN ('player', 'npc1', 'npc2', 'npc3', 'npc4', 'npc5', 'npc6', 'npc7', 'npc8'))
);
