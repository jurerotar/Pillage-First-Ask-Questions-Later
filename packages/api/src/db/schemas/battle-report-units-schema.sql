CREATE TABLE battle_report_units
(
  battle_participant_id INTEGER NOT NULL,
  unit_id INTEGER NOT NULL,
  amount_before INTEGER NOT NULL CHECK (amount_before >= 0),
  amount_after INTEGER NOT NULL CHECK (amount_after >= 0),
  amount_hospitalized INTEGER NOT NULL DEFAULT 0 CHECK (amount_hospitalized >= 0),
  amount_imprisoned INTEGER NOT NULL DEFAULT 0 CHECK (amount_imprisoned >= 0),

  PRIMARY KEY (battle_participant_id, unit_id),
  CHECK (amount_after <= amount_before),
  CHECK (amount_hospitalized <= amount_before - amount_after),
  CHECK (amount_imprisoned <= amount_before - amount_after),

  FOREIGN KEY (battle_participant_id) REFERENCES battle_report_participants (id) ON DELETE CASCADE,
  FOREIGN KEY (unit_id) REFERENCES unit_ids (id) ON DELETE CASCADE
) STRICT;
