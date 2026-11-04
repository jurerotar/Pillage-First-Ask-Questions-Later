import { use } from 'react';
import { CookieContext } from 'app/providers/cookie-context';

export type IntlFormatters = {
  dateTime: Intl.DateTimeFormat;
  duration: Intl.DurationFormat;
  list: Intl.ListFormat;
  relativeTime: Intl.RelativeTimeFormat;
  time: Intl.DateTimeFormat;
};

const formattersByLocale = new Map<string, IntlFormatters>();

export const useIntl = (): IntlFormatters => {
  const { locale } = use(CookieContext);

  const cached = formattersByLocale.get(locale);

  if (cached) {
    return cached;
  }

  const formatters: IntlFormatters = {
    duration: new Intl.DurationFormat(locale, {
      style: 'narrow',
      secondsDisplay: 'always',
    }),
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
  };

  formattersByLocale.set(locale, formatters);

  return formatters;
};
