import { useEffect } from 'react';
import { useAppTime } from 'app/(game)/hooks/use-app-time.ts';
import { syncCurrentTime } from 'app/(game)/utils/timer.ts';

export const ApiTimeSync = () => {
  const { appTime } = useAppTime();

  useEffect(() => {
    syncCurrentTime(appTime);
  }, [appTime]);

  return null;
};
