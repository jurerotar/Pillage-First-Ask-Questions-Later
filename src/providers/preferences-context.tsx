import React, { ReactElement, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createContext } from 'use-context-selector';
import { Preferences } from 'interfaces/models/preferences/preferences';
import { AvailableColorSchemes } from 'interfaces/models/preferences/color-scheme';
import useLocalStorage from 'helpers/hooks/use-local-storage';

type PreferencesProviderProps = {
  children: ReactElement;
};

export type PreferencesProviderValues = {
  locale: Preferences['locale'];
  setLocale: React.Dispatch<React.SetStateAction<Preferences['locale']>>;
  colorScheme: AvailableColorSchemes;
  setColorScheme: React.Dispatch<React.SetStateAction<AvailableColorSchemes>>;
  isColorSchemeSetExplicitly: Preferences['isColorSchemeSetExplicitly'];
  setIsColorSchemeSetExplicitly: React.Dispatch<React.SetStateAction<Preferences['isColorSchemeSetExplicitly']>>;
  isAccessibilityModeEnabled: Preferences['isAccessibilityModeEnabled'];
  setIsAccessibilityModeEnabled: React.Dispatch<React.SetStateAction<Preferences['isAccessibilityModeEnabled']>>;
  isReducedMotionModeEnabled: Preferences['isReducedMotionModeEnabled'];
  setIsReducedMotionModeEnabled: React.Dispatch<React.SetStateAction<Preferences['isReducedMotionModeEnabled']>>;
};

const PreferencesContext = createContext<PreferencesProviderValues>({} as PreferencesProviderValues);

const PreferencesProvider: React.FC<PreferencesProviderProps> = (props): ReactElement => {
  const { children } = props;

  const { i18n } = useTranslation();
  const devicePreferredColorScheme: AvailableColorSchemes = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';

  const [preferences, setPreferences] = useLocalStorage<Preferences>('preferences', {
    locale: 'en-US',
    colorScheme: 'light',
    isColorSchemeSetExplicitly: false,
    isAccessibilityModeEnabled: false,
    isReducedMotionModeEnabled: false
  });

  const [colorScheme, setColorScheme] = useState<AvailableColorSchemes>(preferences.colorScheme);
  const [isColorSchemeSetExplicitly, setIsColorSchemeSetExplicitly] = useState<Preferences['isColorSchemeSetExplicitly']>(preferences.isColorSchemeSetExplicitly);
  const [locale, setLocale] = useState<Preferences['locale']>(preferences.locale);
  const [isAccessibilityModeEnabled, setIsAccessibilityModeEnabled] = useState<Preferences['isAccessibilityModeEnabled']>(preferences.isAccessibilityModeEnabled);
  const [isReducedMotionModeEnabled, setIsReducedMotionModeEnabled] = useState<Preferences['isReducedMotionModeEnabled']>(preferences.isReducedMotionModeEnabled);

  // Update color scheme if user's device default differs from app default and user hasn't explicitly set preference
  useEffect(() => {
    if (!isColorSchemeSetExplicitly && colorScheme !== devicePreferredColorScheme) {
      setColorScheme(devicePreferredColorScheme);
    }
  }, []);

  useEffect(() => {
    const html = document.querySelector<HTMLHtmlElement>('html');
    if (html) {
      const previousColorScheme: AvailableColorSchemes = colorScheme === 'dark' ? 'light' : 'dark';
      html.classList.remove(previousColorScheme);
      html.classList.add(colorScheme);
    }
  }, [colorScheme]);

  // If preferred language is different from default, update language
  useEffect(() => {
    if (locale !== i18n.language) {
      i18n.language = locale;
    }
  }, [locale]);

  // Save preferences to localStorage on preference change
  useEffect(() => {
    setPreferences({
      colorScheme,
      isColorSchemeSetExplicitly,
      locale,
      isAccessibilityModeEnabled,
      isReducedMotionModeEnabled
    });
  }, [colorScheme, isColorSchemeSetExplicitly, locale, isAccessibilityModeEnabled, isReducedMotionModeEnabled]);

  const value = useMemo<PreferencesProviderValues>(() => {
    return {
      colorScheme,
      setColorScheme,
      isColorSchemeSetExplicitly,
      setIsColorSchemeSetExplicitly,
      locale,
      setLocale,
      isAccessibilityModeEnabled,
      setIsAccessibilityModeEnabled,
      isReducedMotionModeEnabled,
      setIsReducedMotionModeEnabled
    };
  }, [colorScheme, isColorSchemeSetExplicitly, locale, isAccessibilityModeEnabled, isReducedMotionModeEnabled]);

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

export {
  PreferencesContext,
  PreferencesProvider
};
