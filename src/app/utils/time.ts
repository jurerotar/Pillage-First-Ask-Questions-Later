import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';

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

  // Calculate the difference between the future timestamp and now
  const length = dayjs.duration(futureTime.diff(now));

  // Format the difference as 'HH:mm:ss'
  return dayjs(length.asMilliseconds()).format('HH:mm:ss');
};
