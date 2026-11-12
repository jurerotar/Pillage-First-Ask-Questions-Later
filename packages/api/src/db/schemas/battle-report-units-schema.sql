CREATE TABLE battle_report_units
(
  battle_participant_id INTEGER NOT NULL,
  unit_id INTEGER NOT NULL,
  amount_before INTEGER NOT NULL CHECK (amount_before >= 0),
  amount_after INTEGER NOT NULL CHECK (amount_after >= 0),
  amount_hospitalized INTEGER NOT NULL CHECK (amount_hospitalized >= 0),
  amount_imprisoned INTEGER NOT NULL CHECK (amount_imprisoned >= 0),
  amount_bandaged INTEGER NOT NULL CHECK (amount_bandaged >= 0),
  amount_consumed INTEGER NOT NULL CHECK (amount_consumed >= 0),

  PRIMARY KEY (battle_participant_id, unit_id),
  CONSTRAINT battle_unit_totals_valid CHECK (
    amount_after + amount_hospitalized + amount_imprisoned
      + amount_bandaged + amount_consumed <= amount_before
  ),

  FOREIGN KEY (battle_participant_id) REFERENCES battle_report_participants (id) ON DELETE CASCADE,
  FOREIGN KEY (unit_id) REFERENCES unit_ids (id) ON DELETE CASCADE
) STRICT;
