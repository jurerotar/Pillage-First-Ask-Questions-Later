CREATE TABLE preferences
(
  preference_key TEXT PRIMARY KEY,
  text_value TEXT,
  bool_value BOOLEAN,

  CHECK (
    (preference_key = 'colorScheme' AND text_value IN ('light', 'dark') AND bool_value IS NULL) OR
    (preference_key = 'locale' AND text_value IN ('en-US') AND bool_value IS NULL) OR
    (preference_key = 'timeOfDay' AND text_value IN ('day', 'night') AND bool_value IS NULL) OR
    (preference_key = 'skinVariant' AND text_value IN ('default') AND bool_value IS NULL) OR
    (preference_key IN (
        'isAccessibilityModeEnabled',
        'isReducedMotionModeEnabled',
        'shouldShowBuildingNames',
        'isAutomaticNavigationAfterBuildingLevelChangeEnabled',
        'isDeveloperModeEnabled',
        'shouldShowNotificationsOnBuildingUpgradeCompletion',
        'shouldShowNotificationsOnUnitUpgradeCompletion',
        'shouldShowNotificationsOnAcademyResearchCompletion'
      ) AND bool_value IN (0, 1) AND text_value IS NULL)
    )
);

CREATE INDEX idx_preferences_preference_key ON preferences (preference_key);

