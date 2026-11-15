CREATE TABLE village_conquest_failure_reason_ids
(
  id INTEGER PRIMARY KEY,
  reason TEXT NOT NULL UNIQUE CHECK (reason IN (
    'no-surviving-administrator',
    'defenders-survived',
    'administration-building-present',
    'target-is-capital',
    'target-is-last-village',
    'insufficient-culture-points',
    'no-free-expansion-slot',
    'loyalty-not-zero'
  ))
) STRICT;
