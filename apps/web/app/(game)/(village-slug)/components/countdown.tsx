import { clsx } from 'clsx';
import type { HTMLAttributes } from 'react';
import { useCountdown } from 'app/(game)/(village-slug)/hooks/use-countdown';
import { formatTime } from 'app/utils/time';

type CountdownProps = {
  endsAt: number;
} & HTMLAttributes<HTMLElement>;

export const Countdown = ({ endsAt, ...rest }: CountdownProps) => {
  const { className } = rest;

  const currentTime = useCountdown();

  const remainingTime = Math.max(0, endsAt - currentTime);
  const formattedTime = formatTime(remainingTime);

  return (
    <span
      className={clsx('tabular-nums', className)}
      {...rest}
    >
      {formattedTime}
    </span>
  );
};
