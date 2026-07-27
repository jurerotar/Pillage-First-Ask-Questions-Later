CREATE TABLE report_type_ids
(
  id INTEGER PRIMARY KEY,
  report_type TEXT NOT NULL UNIQUE CHECK (report_type IN ('battle', 'adventure', 'trade', 'movement', 'huntingParty', 'gatheringExpedition', 'scouting'))
) STRICT;

CREATE INDEX idx_report_type_ids_report_type ON report_type_ids(report_type);
