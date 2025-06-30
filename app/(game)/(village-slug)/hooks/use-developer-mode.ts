import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';

export const useDeveloperMode = () => {
  const { preferences } = usePreferences();

  const { isDeveloperModeEnabled } = preferences;

  return {
    isDeveloperModeEnabled,
  };
};
