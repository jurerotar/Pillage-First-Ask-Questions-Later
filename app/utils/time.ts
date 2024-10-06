import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
dayjs.extend(duration);

export const formatTime = (milliseconds: number): string => {
  return dayjs.duration(milliseconds).format('HH:mm:ss');
};

export const formatToRelativeTime = (timestamp: number): string => {
  return dayjs().from(timestamp);
};

export const formatFutureTimestamp = (futureTimestamp: number) => {
  const now = dayjs();
  const futureTime = dayjs(futureTimestamp);

  const isToday = futureTime.isSame(now, 'day');

  if (isToday) {
    return futureTime.format('H:mm');
  }
  return futureTime.format('M.D, H:mm');
};

export const formatCountdown = (futureTimestamp: number) => {
  const now = dayjs();
  const futureTime = dayjs(futureTimestamp);

  // Calculate the difference between the future timestamp and now
  const length = dayjs.duration(futureTime.diff(now));

  const hours = String(Math.floor(length.asHours())).padStart(2, '0');
  const minutes = String(length.minutes()).padStart(2, '0');
  const seconds = String(length.seconds()).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
};
