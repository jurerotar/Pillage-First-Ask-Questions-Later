import { clsx } from 'clsx';
import { use, useEffect } from 'react';
import { useTextDirection } from 'app/hooks/use-text-direction';
import { CookieContext } from 'app/providers/cookie-context';
import layoutStyles from '../layout.module.scss';

export const PreferencesUpdater = () => {
  const { locale } = use(CookieContext);

  const { direction } = useTextDirection(locale);

  useEffect(() => {
    const body = document.querySelector('body')!;

    body.classList.add(layoutStyles['background-image']);

    return () => {
      body.classList.remove(clsx(layoutStyles['background-image']));
    };
  }, []);

  useEffect(() => {
    const html = document.documentElement;

    html.setAttribute('dir', direction);

    return () => {
      html.removeAttribute('dir');
    };
  }, [direction]);

  return null;
};
