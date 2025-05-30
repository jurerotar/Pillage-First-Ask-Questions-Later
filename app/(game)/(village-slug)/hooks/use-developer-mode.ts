import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';

export const useDeveloperMode = () => {
  const { isDeveloperModeEnabled } = usePreferences();

  return {
    isDeveloperModeEnabled,
  };
};
