import { clsx } from 'clsx';
import { useEffect } from 'react';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { useTextDirection } from 'app/hooks/use-text-direction';
import layoutStyles from '../layout.module.scss';

export const PreferencesUpdater = () => {
  const { preferences } = usePreferences();

  const { timeOfDay, skinVariant, colorScheme, locale } = preferences;

  const { direction } = useTextDirection(locale);

  useEffect(() => {
    const body = document.querySelector('body')!;

    body.classList.add(layoutStyles['background-image']);

    return () => {
      body.classList.remove(clsx(layoutStyles['background-image']));
    };
  }, []);

  useEffect(() => {
    if (!(colorScheme && skinVariant && timeOfDay)) {
      return;
    }
    const html = document.documentElement;

    html.setAttribute('dir', direction);
    html.classList.add(
      colorScheme,
      `skin-variant-${skinVariant}`,
      `time-of-day-${timeOfDay}`,
    );

    return () => {
      html.removeAttribute('dir');
      html.classList.remove(
        colorScheme,
        `skin-variant-${skinVariant}`,
        `time-of-day-${timeOfDay}`,
      );
    };
  }, [skinVariant, timeOfDay, colorScheme, direction]);

  return null;
};
