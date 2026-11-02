import type { IntlFormatters } from 'app/hooks/use-intl';

export const formatDuration = (
  milliseconds: number,
  intl: Pick<IntlFormatters, 'duration'>,
): string => {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));

  return intl.duration.format({
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  });
};

export const formatTime = (milliseconds: number): string => {
  let time = '';

  const hours = Math.floor(milliseconds / 1000 / 60 / 60).toString();
  const minutes = Math.floor((milliseconds / 1000 / 60) % 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor((milliseconds / 1000) % 60)
    .toString()
    .padStart(2, '0');

  if (hours !== '00') {
    time += `${hours}:`;
  }

  time += `${minutes}:${seconds}`;

  return time;
};

export const formatFutureTimestamp = (
  futureTimestamp: number,
  currentTimestamp: number,
  intl: IntlFormatters,
) => {
  const now = new Date(currentTimestamp);
  const future = new Date(futureTimestamp);

  const isToday =
    now.getFullYear() === future.getFullYear() &&
    now.getMonth() === future.getMonth() &&
    now.getDate() === future.getDate();

  return {
    isToday,
    formattedDate: (isToday ? intl.time : intl.dateTime).format(future),
  };
};

const MS_IN_HOUR = 60 * 60 * 1000;
const MS_IN_DAY = 24 * MS_IN_HOUR;

export const daysSince = (timestamp: number, intl: IntlFormatters): string => {
  const diffMs = Date.now() - timestamp;
  const days = Math.floor(diffMs / MS_IN_DAY);

  if (days !== 0) {
    return intl.relativeTime.format(-days, 'day');
  }

  // If fewer than 1 day, return hours
  const hours = Math.floor(diffMs / MS_IN_HOUR);
  return intl.relativeTime.format(-hours, 'hour');
};
