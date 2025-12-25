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

export const formatFutureTimestamp = (futureTimestamp: number): string => {
  const now = new Date();
  const future = new Date(futureTimestamp);

  const isToday =
    now.getFullYear() === future.getFullYear() &&
    now.getMonth() === future.getMonth() &&
    now.getDate() === future.getDate();

  const hour = future.getHours(); // H (0-23) — no leading zero
  const minute = String(future.getMinutes()).padStart(2, '0'); // mm

  if (isToday) {
    return `${hour}:${minute}`;
  }

  const month = future.getMonth() + 1; // M (1-12)
  const day = future.getDate(); // d (1-31)

  return `${month}.${day}, ${hour}:${minute}`;
};

const MS_IN_HOUR = 60 * 60 * 1000;
const MS_IN_DAY = 24 * MS_IN_HOUR;

export const daysSince = (
  timestamp: number,
  locale: ConstructorParameters<typeof Intl.RelativeTimeFormat>[0],
): string => {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  const diffMs = Date.now() - timestamp;
  const days = Math.floor(diffMs / MS_IN_DAY);

  if (days !== 0) {
    return rtf.format(-days, 'day');
  }

  // If fewer than 1 day, return hours
  const hours = Math.floor(diffMs / MS_IN_HOUR);
  return rtf.format(-hours, 'hour');
};
