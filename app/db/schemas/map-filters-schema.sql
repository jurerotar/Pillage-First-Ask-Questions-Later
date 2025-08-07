CREATE TABLE map_filters
(
  filter_key TEXT CHECK (
    filter_key IN (
      'shouldShowFactionReputation',
      'shouldShowOasisIcons',
      'shouldShowTroopMovements',
      'shouldShowWheatFields',
      'shouldShowTileTooltips',
      'shouldShowTreasureIcons'
      )
    )               NOT NULL,
  value     BOOLEAN NOT NULL
);

CREATE INDEX idx_map_filters_filter_key ON map_filters (filter_key);

