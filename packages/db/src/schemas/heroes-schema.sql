CREATE TABLE heroes
(
  id INTEGER PRIMARY KEY,
  player_id INTEGER NOT NULL,

  health INTEGER NOT NULL DEFAULT 100 CHECK (health BETWEEN 0 AND 100),
  experience INTEGER NOT NULL DEFAULT 0 CHECK (experience >= 0),
  base_attack_power INTEGER NOT NULL CHECK (base_attack_power >= 0),
  health_regeneration INTEGER NOT NULL CHECK (health_regeneration >= 0),
  damage_reduction INTEGER NOT NULL CHECK (damage_reduction >= 0),
  experience_modifier INTEGER NOT NULL CHECK (experience_modifier >= 0),
  speed INTEGER NOT NULL CHECK (speed >= 0),
  natarian_attack_bonus INTEGER NOT NULL CHECK (natarian_attack_bonus >= 0),
  attack_bonus INTEGER NOT NULL CHECK (attack_bonus >= 0),
  defence_bonus INTEGER NOT NULL CHECK (defence_bonus >= 0),

  resource_to_produce TEXT CHECK ( resource_to_produce IN ('shared', 'wood', 'clay', 'iron', 'wheat') ) NOT NULL,

  FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE
) STRICT;

CREATE INDEX idx_heroes_player_id ON heroes(player_id);
