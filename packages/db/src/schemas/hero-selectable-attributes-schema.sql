CREATE TABLE hero_selectable_attributes
(
  hero_id INTEGER PRIMARY KEY,

  attack_power INTEGER NOT NULL DEFAULT 0 CHECK (attack_power >= 0),
  resource_production INTEGER NOT NULL DEFAULT 4 CHECK (resource_production >= 0),
  attack_bonus INTEGER NOT NULL DEFAULT 0 CHECK (attack_bonus >= 0),
  defence_bonus INTEGER NOT NULL DEFAULT 0 CHECK (defence_bonus >= 0),

  FOREIGN KEY (hero_id) REFERENCES heroes (id) ON DELETE CASCADE
) STRICT;
