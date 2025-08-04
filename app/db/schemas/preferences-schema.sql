CREATE TABLE preferences
(
  preference_id TEXT PRIMARY KEY,
  text_value     TEXT,
  bool_value     BOOLEAN,

  CHECK (
    (preference_id = 'colorScheme' AND text_value IN ('light', 'dark') AND bool_value IS NULL) OR
    (preference_id = 'locale' AND text_value IN ('en-US') AND bool_value IS NULL) OR
    (preference_id = 'timeOfDay' AND text_value IN ('day', 'night') AND bool_value IS NULL) OR
    (preference_id = 'skinVariant' AND text_value IN ('default') AND bool_value IS NULL) OR
    (preference_id IN (
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

CREATE INDEX idx_preferences_preference_id ON preferences(preference_id);

