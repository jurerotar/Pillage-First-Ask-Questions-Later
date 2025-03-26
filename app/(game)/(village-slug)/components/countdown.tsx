import { formatFutureTimestamp, formatTime } from 'app/utils/time';
import type React from 'react';
import { use } from 'react';
import { CountdownContext } from 'app/(game)/(village-slug)/providers/countdown-provider';

type CountdownProps = {
  endsAt: number;
  showCompletionDate?: boolean;
} & React.HTMLAttributes<HTMLElement>;

export const Countdown: React.FC<CountdownProps> = ({ endsAt, showCompletionDate = false, ...rest }) => {
  const { currentTime } = use(CountdownContext);

  const remainingTime = Math.max(0, endsAt - currentTime);
  const formattedTime = formatTime(remainingTime);

  return (
    <span {...rest}>
      {formattedTime}
      {showCompletionDate && <span>(done at: {formatFutureTimestamp(endsAt)})</span>}
    </span>
  );
};
