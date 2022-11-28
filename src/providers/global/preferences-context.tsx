import React, { ReactElement, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createContext } from 'use-context-selector';
import { Preferences } from 'interfaces/models/preferences/preferences';
import { AvailableColorSchemes } from 'interfaces/models/preferences/color-scheme';
import { useLocalStorage } from 'utils/hooks/use-local-storage';

type PreferencesProviderProps = {
  children: ReactElement;
};

export type PreferencesProviderValues = {
  locale: Preferences['locale'];
  colorScheme: AvailableColorSchemes;
  isAccessibilityModeEnabled: Preferences['isAccessibilityModeEnabled'];
  isReducedMotionModeEnabled: Preferences['isReducedMotionModeEnabled'];
  changeLocale: (language: Preferences['locale']) => void;
  toggleColorScheme: () => void;
  toggleAccessibilityMode: () => void;
  toggleReducedMotionMode: () => void;
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

  // const [colorScheme, setColorScheme] = useState<AvailableColorSchemes>(preferences.colorScheme);
  const [colorScheme, setColorScheme] = useState<AvailableColorSchemes>('light');
  const [isColorSchemeSetExplicitly, setIsColorSchemeSetExplicitly] = useState<Preferences['isColorSchemeSetExplicitly']>(preferences.isColorSchemeSetExplicitly);
  const [locale, setLocale] = useState<Preferences['locale']>(preferences.locale);
  const [isAccessibilityModeEnabled, setIsAccessibilityModeEnabled] = useState<Preferences['isAccessibilityModeEnabled']>(preferences.isAccessibilityModeEnabled);
  const [isReducedMotionModeEnabled, setIsReducedMotionModeEnabled] = useState<Preferences['isReducedMotionModeEnabled']>(preferences.isReducedMotionModeEnabled);

  const changeLocale = (language: Preferences['locale']): void => {
    i18n.language = language;
    setLocale(language);
  };

  const toggleColorScheme = (): void => {
    const html = document.querySelector('html')!;
    const currentColorScheme = colorScheme;
    const nextColorScheme = colorScheme === 'light' ? 'dark' : 'light';
    html.classList.remove(currentColorScheme);
    html.classList.add(nextColorScheme);
    setIsColorSchemeSetExplicitly(true);
    setColorScheme(nextColorScheme);
  };

  const toggleAccessibilityMode = (): void => {
    const html = document.querySelector('html')!;
    if (isAccessibilityModeEnabled) {
      html.classList.remove('accessible');
    } else {
      html.classList.add('accessible');
    }
    setIsAccessibilityModeEnabled((prev) => !prev);
  };

  const toggleReducedMotionMode = (): void => {
    const html = document.querySelector('html')!;
    if (isReducedMotionModeEnabled) {
      html.classList.remove('reduced-motion');
    } else {
      html.classList.add('reduced-motion');
    }
    setIsReducedMotionModeEnabled((prev) => !prev);
  };

  // Update color scheme if user's device default differs from app default and user hasn't explicitly set preference
  useEffect(() => {
    if (!isColorSchemeSetExplicitly && colorScheme !== devicePreferredColorScheme) {
      // setColorScheme(devicePreferredColorScheme);
      setColorScheme('light');
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
      locale,
      colorScheme,
      isColorSchemeSetExplicitly,
      isAccessibilityModeEnabled,
      isReducedMotionModeEnabled
    });
  }, [colorScheme, isColorSchemeSetExplicitly, locale, isAccessibilityModeEnabled, isReducedMotionModeEnabled]);

  const value: PreferencesProviderValues = {
    locale,
    changeLocale,
    colorScheme,
    isAccessibilityModeEnabled,
    isReducedMotionModeEnabled,
    toggleColorScheme,
    toggleAccessibilityMode,
    toggleReducedMotionMode
  };

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
