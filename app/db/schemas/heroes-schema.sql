CREATE TABLE heroes
(
  id INTEGER PRIMARY KEY,

  -- stats
  health INTEGER NOT NULL DEFAULT 100 CHECK (health BETWEEN 0 AND 100),
  experience INTEGER NOT NULL DEFAULT 0 CHECK (experience >= 0),

  -- selectable attributes
  attack_power INTEGER NOT NULL DEFAULT 0 CHECK (attack_power >= 0),
  resource_production INTEGER NOT NULL DEFAULT 4 CHECK (resource_production >= 0),
  attack_bonus INTEGER NOT NULL DEFAULT 0 CHECK (attack_bonus >= 0),
  defence_bonus INTEGER NOT NULL DEFAULT 0 CHECK (defence_bonus >= 0),

  resource_to_produce TEXT CHECK ( resource_to_produce IN ('shared', 'wood', 'clay', 'iron', 'wheat') ) NOT NULL,
  adventure_count INTEGER NOT NULL DEFAULT 0 CHECK (adventure_count >= 0)
);
