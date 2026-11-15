CREATE TABLE oasis_capture_failure_reason_ids
(
  id INTEGER PRIMARY KEY,
  reason TEXT NOT NULL UNIQUE CHECK (reason IN (
    'no-surviving-hero',
    'defenders-survived',
    'out-of-range',
    'no-free-oasis-slot',
    'loyalty-not-zero'
  ))
) STRICT;
