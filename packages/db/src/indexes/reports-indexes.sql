CREATE INDEX idx_reports_player_timestamp
ON reports(player_id, timestamp DESC);

CREATE INDEX idx_reports_player_village_timestamp
ON reports(player_id, village_id, timestamp DESC);

CREATE INDEX idx_reports_player_type_timestamp
ON reports(player_id, type_id, timestamp DESC);

CREATE INDEX idx_battle_report_participants_battle
ON battle_report_participants(battle_id);
