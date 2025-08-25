CREATE TABLE heroes
(
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- stats
  experience INTEGER NOT NULL DEFAULT 0,
  health INTEGER NOT NULL DEFAULT 100,

  -- selectable attributes
  attack_power INTEGER NOT NULL DEFAULT 0,
  resource_production INTEGER NOT NULL DEFAULT 4,
  attack_bonus INTEGER NOT NULL DEFAULT 0,
  defence_bonus INTEGER NOT NULL DEFAULT 0,

  resource_to_produce TEXT CHECK ( resource_to_produce IN ('shared', 'wood', 'clay', 'iron', 'wheat') ) NOT NULL,
  adventure_count INTEGER NOT NULL DEFAULT 0
);
