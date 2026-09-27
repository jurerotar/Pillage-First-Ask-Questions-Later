CREATE TABLE report_filters
(
  player_id INTEGER NOT NULL,
  filter    TEXT    NOT NULL CHECK (filter IN ('battle', 'adventure', 'trade', 'movement', 'huntingParty', 'gatheringExpedition', 'scouting', 'unitResearch', 'unitImprovement', 'villageFounded', 'scheduledConstructionCancellation', 'noLoss', 'ownTrades')),
  is_active INTEGER NOT NULL CHECK (is_active IN (0, 1)),

  PRIMARY KEY (player_id, filter),
  FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE
) STRICT;

CREATE INDEX idx_report_filters_player_id ON report_filters(player_id);
