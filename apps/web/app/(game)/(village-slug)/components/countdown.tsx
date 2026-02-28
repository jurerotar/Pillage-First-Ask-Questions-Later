import type { HTMLAttributes } from 'react';
import { useCountdown } from 'app/(game)/(village-slug)/hooks/use-countdown';
import { formatTime } from 'app/utils/time';

type CountdownProps = {
  endsAt: number;
} & HTMLAttributes<HTMLElement>;

export const Countdown = ({ endsAt, ...rest }: CountdownProps) => {
  const currentTime = useCountdown();

  const remainingTime = Math.max(0, endsAt - currentTime);
  const formattedTime = formatTime(remainingTime);

  return <span {...rest}>{formattedTime}</span>;
};
