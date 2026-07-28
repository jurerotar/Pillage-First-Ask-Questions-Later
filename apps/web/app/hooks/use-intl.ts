import { use, useMemo } from 'react';
import { CookieContext } from 'app/providers/cookie-provider';

export type IntlFormatters = {
  dateTime: Intl.DateTimeFormat;
  list: Intl.ListFormat;
  relativeTime: Intl.RelativeTimeFormat;
  time: Intl.DateTimeFormat;
};

export const useIntl = (): IntlFormatters => {
  const { locale } = use(CookieContext);

  return useMemo(
    () => ({
      dateTime: new Intl.DateTimeFormat(locale, {
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
      }),
      list: new Intl.ListFormat(locale, {
        style: 'long',
        type: 'conjunction',
      }),
      relativeTime: new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }),
      time: new Intl.DateTimeFormat(locale, {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
      }),
    }),
    [locale],
  );
};
