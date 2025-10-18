CREATE INDEX idx_game_events_ends_at ON game_events (ends_at);
CREATE INDEX idx_game_events_village ON game_events (village_id) WHERE village_id IS NOT NULL;
