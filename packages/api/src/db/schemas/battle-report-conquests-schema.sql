CREATE TABLE battle_report_conquests
(
  battle_id INTEGER PRIMARY KEY,
  loyalty_before REAL CHECK (loyalty_before BETWEEN 0 AND 125),
  loyalty_after REAL CHECK (loyalty_after BETWEEN 0 AND 125),
  succeeded INTEGER NOT NULL CHECK (succeeded IN (0, 1)),
  village_conquest_failure_reason_id INTEGER,
  oasis_capture_failure_reason_id INTEGER,

  CHECK ((loyalty_before IS NULL) = (loyalty_after IS NULL)),
  CHECK (village_conquest_failure_reason_id IS NULL OR succeeded = 0),
  CHECK (oasis_capture_failure_reason_id IS NULL OR succeeded = 0),
  CHECK (village_conquest_failure_reason_id IS NULL OR oasis_capture_failure_reason_id IS NULL),

  FOREIGN KEY (battle_id) REFERENCES battle_reports (id) ON DELETE CASCADE,
  FOREIGN KEY (village_conquest_failure_reason_id) REFERENCES village_conquest_failure_reason_ids (id),
  FOREIGN KEY (oasis_capture_failure_reason_id) REFERENCES oasis_capture_failure_reason_ids (id)
) STRICT;
