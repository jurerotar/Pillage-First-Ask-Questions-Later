import { clsx } from 'clsx';
import { use, useEffect } from 'react';
import { useTextDirection } from 'app/hooks/use-text-direction';
import layoutStyles from '../layout.module.scss';
import { CookieContext } from 'app/providers/cookie-provider';

export const PreferencesUpdater = () => {
  const { locale, skinVariant, uiColorScheme, timeOfDay } = use(CookieContext);

  const { direction } = useTextDirection(locale);

  useEffect(() => {
    const body = document.querySelector('body')!;

    body.classList.add(layoutStyles['background-image']);

    return () => {
      body.classList.remove(clsx(layoutStyles['background-image']));
    };
  }, []);

  useEffect(() => {
    if (!(uiColorScheme && skinVariant && timeOfDay)) {
      return;
    }
    const html = document.documentElement;

    html.setAttribute('dir', direction);
    html.classList.add(
      uiColorScheme,
      `skin-variant-${skinVariant}`,
      `time-of-day-${timeOfDay}`,
    );

    return () => {
      html.removeAttribute('dir');
      html.classList.remove(
        uiColorScheme,
        `skin-variant-${skinVariant}`,
        `time-of-day-${timeOfDay}`,
      );
    };
  }, [skinVariant, timeOfDay, uiColorScheme, direction]);

  return null;
};
