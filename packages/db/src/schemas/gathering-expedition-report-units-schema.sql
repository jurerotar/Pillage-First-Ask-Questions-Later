CREATE TABLE gathering_expedition_report_units (
  gathering_expedition_report_id INTEGER NOT NULL REFERENCES gathering_expedition_reports(id) ON DELETE CASCADE,
  unit_id INTEGER NOT NULL REFERENCES unit_ids(id),
  amount INTEGER NOT NULL,
  PRIMARY KEY (gathering_expedition_report_id, unit_id)
) STRICT, WITHOUT ROWID;
