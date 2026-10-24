CREATE TABLE hunting_party_report_units (
  hunting_party_report_id INTEGER NOT NULL REFERENCES hunting_party_reports(id) ON DELETE CASCADE,
  unit_id INTEGER NOT NULL REFERENCES unit_ids(id),
  amount INTEGER NOT NULL,
  PRIMARY KEY (hunting_party_report_id, unit_id)
) STRICT, WITHOUT ROWID;
