CREATE TABLE scheduled_construction_cancellation_reports
(
  report_id INTEGER PRIMARY KEY,
  village_id INTEGER NOT NULL,
  building_id INTEGER NOT NULL,
  field_id INTEGER NOT NULL,
  level INTEGER NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('missing-resources', 'missing-requirements')),
  reason_detail_json TEXT NOT NULL,

  FOREIGN KEY (report_id) REFERENCES reports (id) ON DELETE CASCADE,
  FOREIGN KEY (village_id) REFERENCES villages (id) ON DELETE CASCADE,
  FOREIGN KEY (building_id) REFERENCES building_ids (id)
) STRICT;

CREATE INDEX idx_scheduled_construction_cancellation_reports_village_id ON scheduled_construction_cancellation_reports(village_id);
