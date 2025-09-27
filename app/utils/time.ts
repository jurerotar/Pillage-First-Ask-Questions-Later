import { format, formatDistanceToNow, isSameDay } from 'date-fns';

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

export const formatToRelativeTime = (timestamp: number): string => {
  return formatDistanceToNow(timestamp, { addSuffix: true });
};

export const formatFutureTimestamp = (futureTimestamp: number): string => {
  const now = new Date();
  const futureTime = new Date(futureTimestamp);

  const isToday = isSameDay(now, futureTime);

  return isToday ? format(futureTime, 'H:mm') : format(futureTime, 'M.d, H:mm');
};

export const formatCountdown = (futureTimestamp: number): string => {
  const now = new Date();
  const diffMs = Math.max(futureTimestamp - now.getTime(), 0);

  const hours = Math.floor(diffMs / 1000 / 60 / 60)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor((diffMs / 1000 / 60) % 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor((diffMs / 1000) % 60)
    .toString()
    .padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
};
