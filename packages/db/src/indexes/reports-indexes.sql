CREATE INDEX idx_reports_timestamp
ON reports(timestamp DESC);

CREATE INDEX idx_reports_village_timestamp
ON reports(village_id, timestamp DESC);

CREATE INDEX idx_battle_report_participants_battle
ON battle_report_participants(battle_id);
