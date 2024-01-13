import React, { useEffect, useState } from 'react';
import { formatRemainingTime } from 'app/utils/common';

type CountdownProps = {
  endTime: number;
  className?: string;
};

export const Countdown: React.FC<CountdownProps> = (props) => {
  const { endTime, className = '' } = props;

  const [formattedTime, setFormattedTime] = useState<string>('');

  useEffect(() => {
    const intervalId = setInterval(() => {
      setFormattedTime(formatRemainingTime(endTime));
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return <span className={className}>{formattedTime}</span>;
};
