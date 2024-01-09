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
