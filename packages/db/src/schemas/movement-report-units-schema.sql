CREATE TABLE movement_report_units
(
  movement_report_id INTEGER NOT NULL,
  unit_id INTEGER NOT NULL,
  amount INTEGER NOT NULL CHECK (amount >= 0),

  PRIMARY KEY (movement_report_id, unit_id),
  FOREIGN KEY (movement_report_id) REFERENCES movement_reports (id) ON DELETE CASCADE,
  FOREIGN KEY (unit_id) REFERENCES unit_ids (id)
) STRICT;
