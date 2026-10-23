CREATE TABLE scouting_report_attacker_units
(
  scouting_report_id INTEGER NOT NULL,
  unit_id INTEGER NOT NULL,
  amount_before INTEGER NOT NULL CHECK (amount_before >= 0),
  amount_after INTEGER NOT NULL CHECK (amount_after >= 0),
  PRIMARY KEY (scouting_report_id, unit_id),
  CHECK (amount_after <= amount_before),
  FOREIGN KEY (scouting_report_id) REFERENCES scouting_reports (id) ON DELETE CASCADE,
  FOREIGN KEY (unit_id) REFERENCES unit_ids (id)
) STRICT;
