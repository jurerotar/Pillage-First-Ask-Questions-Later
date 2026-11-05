CREATE TABLE battle_report_heroes
(
  battle_participant_id INTEGER PRIMARY KEY,
  hero_id INTEGER NOT NULL,
  health_before INTEGER NOT NULL CHECK (health_before BETWEEN 0 AND 100),
  health_after INTEGER NOT NULL CHECK (health_after BETWEEN 0 AND 100),
  experience_gained INTEGER NOT NULL CHECK (experience_gained >= 0),

  FOREIGN KEY (battle_participant_id) REFERENCES battle_report_participants (id) ON DELETE CASCADE
) STRICT;
