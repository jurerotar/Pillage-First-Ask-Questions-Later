CREATE TABLE battle_units
(
  report_id INTEGER NOT NULL,
  battle_participant_id INTEGER NOT NULL,
  unit_id INTEGER NOT NULL,
  amount_before INTEGER NOT NULL,
  amount_after INTEGER NOT NULL,

  PRIMARY KEY (report_id, battle_participant_id, unit_id),

  FOREIGN KEY (report_id) REFERENCES reports (id) ON DELETE CASCADE,
  FOREIGN KEY (battle_participant_id) REFERENCES battle_participants (id) ON DELETE CASCADE,
  FOREIGN KEY (unit_id) REFERENCES unit_ids (id) ON DELETE CASCADE
) STRICT;
