CREATE TABLE battle_units
(
  battle_participant_id INTEGER NOT NULL,
  unit_id INTEGER NOT NULL,
  amount_before INTEGER NOT NULL CHECK (amount_before >= 0),
  amount_after INTEGER NOT NULL CHECK (amount_after >= 0),

  PRIMARY KEY (battle_participant_id, unit_id),
  CHECK (amount_after <= amount_before),

  FOREIGN KEY (battle_participant_id) REFERENCES battle_participants (id) ON DELETE CASCADE,
  FOREIGN KEY (unit_id) REFERENCES unit_ids (id) ON DELETE CASCADE
) STRICT;
