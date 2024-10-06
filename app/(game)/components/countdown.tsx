import { formatCountdown, formatFutureTimestamp } from 'app/utils/time';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';

type CountdownProps = {
  endsAt: number;
} & React.HTMLAttributes<HTMLElement>;

export const Countdown: React.FC<CountdownProps> = ({ endsAt, ...rest }) => {
  const intervalId = useRef<NodeJS.Timeout | null>(null);

  const [formattedTime, setFormattedTime] = useState<string>(formatCountdown(endsAt));

  useEffect(() => {
    if (intervalId.current !== null) {
      clearInterval(intervalId.current);
    }
    intervalId.current = setInterval(() => {
      setFormattedTime(formatCountdown(endsAt));
    }, 1000);

    return () => {
      clearInterval(intervalId.current!);
    };
  }, [endsAt]);

  return (
    <span {...rest}>
      {formattedTime} (done at: {formatFutureTimestamp(endsAt)})
    </span>
  );
};
