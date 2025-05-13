import { formatFutureTimestamp, formatTime } from 'app/utils/time';
import type React from 'react';
import { useCountdown } from 'app/(game)/(village-slug)/hooks/use-countdown';

type CountdownProps = {
  endsAt: number;
  showCompletionDate?: boolean;
} & React.HTMLAttributes<HTMLElement>;

export const Countdown: React.FC<CountdownProps> = ({ endsAt, showCompletionDate = false, ...rest }) => {
  const currentTime = useCountdown();

  const remainingTime = Math.max(0, endsAt - currentTime);
  const formattedTime = formatTime(remainingTime);

  return (
    <span {...rest}>
      {formattedTime}
      {showCompletionDate && <span>(done at: {formatFutureTimestamp(endsAt)})</span>}
    </span>
  );
};
