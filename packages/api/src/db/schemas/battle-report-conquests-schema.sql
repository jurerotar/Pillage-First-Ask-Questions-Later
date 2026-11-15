CREATE TABLE battle_report_conquests
(
  battle_id INTEGER PRIMARY KEY,
  target TEXT NOT NULL CHECK (target IN ('village', 'oasis')),
  loyalty_before REAL CHECK (loyalty_before BETWEEN 0 AND 125),
  loyalty_after REAL CHECK (loyalty_after BETWEEN 0 AND 125),
  succeeded INTEGER NOT NULL CHECK (succeeded IN (0, 1)),
  village_conquest_failure_reason_id INTEGER,
  oasis_capture_failure_reason_id INTEGER,

  CONSTRAINT conquest_loyalty_valid CHECK (
    CASE succeeded
      WHEN 1 THEN loyalty_before IS NOT NULL AND loyalty_after IS 0
      ELSE (loyalty_before IS NULL AND loyalty_after IS NULL)
        OR (loyalty_before IS NOT NULL AND loyalty_after IS NOT NULL
          AND loyalty_after <= loyalty_before)
    END
  ),

  CONSTRAINT conquest_reason_valid CHECK (
    CASE
      WHEN succeeded = 1 THEN village_conquest_failure_reason_id IS NULL
        AND oasis_capture_failure_reason_id IS NULL
      WHEN target = 'village' THEN village_conquest_failure_reason_id IS NOT NULL
        AND oasis_capture_failure_reason_id IS NULL
      ELSE oasis_capture_failure_reason_id IS NOT NULL
        AND village_conquest_failure_reason_id IS NULL
    END
  ),

  FOREIGN KEY (battle_id) REFERENCES battle_reports (id) ON DELETE CASCADE,
  FOREIGN KEY (village_conquest_failure_reason_id) REFERENCES village_conquest_failure_reason_ids (id),
  FOREIGN KEY (oasis_capture_failure_reason_id) REFERENCES oasis_capture_failure_reason_ids (id)
) STRICT;
