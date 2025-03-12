import type React from 'react';
import { createContext, useEffect, useState } from 'react';

type CountdownContextType = {
  currentTime: number;
};

export const CountdownContext = createContext<CountdownContextType>({} as never);

export const CountdownProvider: React.FCWithChildren = ({ children }) => {
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return <CountdownContext.Provider value={{ currentTime }}>{children}</CountdownContext.Provider>;
};
