CREATE INDEX idx_reports_player_timestamp
ON reports(player_id, timestamp DESC);

CREATE INDEX idx_battle_report_participants_battle
ON battle_report_participants(battle_id);
