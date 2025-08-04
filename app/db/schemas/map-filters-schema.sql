CREATE TABLE map_filters
(
  filter_id TEXT CHECK (filter_id IN ('shouldShowFactionReputation', 'shouldShowOasisIcons', 'shouldShowTroopMovements',
                                      'shouldShowWheatFields', 'shouldShowTileTooltips',
                                      'shouldShowTreasureIcons')) NOT NULL,
  value     BOOLEAN                                               NOT NULL
);
