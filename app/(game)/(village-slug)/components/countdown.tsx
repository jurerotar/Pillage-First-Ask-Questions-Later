import type { HTMLAttributes } from 'react';
import { useCountdown } from 'app/(game)/(village-slug)/hooks/use-countdown';
import { formatFutureTimestamp, formatTime } from 'app/utils/time';

type CountdownProps = {
  endsAt: number;
  showCompletionDate?: boolean;
} & HTMLAttributes<HTMLElement>;

export const Countdown = ({
  endsAt,
  showCompletionDate = false,
  ...rest
}: CountdownProps) => {
  const currentTime = useCountdown();

  const remainingTime = Math.max(0, endsAt - currentTime);
  const formattedTime = formatTime(remainingTime);

  return (
    <span {...rest}>
      {formattedTime}
      {showCompletionDate && (
        <span>(done at: {formatFutureTimestamp(endsAt)})</span>
      )}
    </span>
  );
};
