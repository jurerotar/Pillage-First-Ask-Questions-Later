CREATE TABLE reports
(
  id INTEGER PRIMARY KEY,
  village_id INTEGER NOT NULL,
  timestamp INTEGER NOT NULL,
  type_id INTEGER NOT NULL,
  report_outcome_id INTEGER NOT NULL,

  FOREIGN KEY (village_id) REFERENCES villages (id) ON DELETE CASCADE,
  FOREIGN KEY (type_id) REFERENCES report_type_ids (id),
  FOREIGN KEY (report_outcome_id) REFERENCES report_outcome_ids (id)
) STRICT;
