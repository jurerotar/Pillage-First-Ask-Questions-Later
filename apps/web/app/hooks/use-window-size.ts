import { useWindowEvent } from '@mantine/hooks';
import { useCallback, useLayoutEffect, useState } from 'react';

const eventListerOptions = {
  passive: true,
};

export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState(() => {
    if (typeof window !== 'undefined') {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    }

    return {
      width: 0,
      height: 0,
    };
  });

  const setSize = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    setWindowSize((current) => {
      if (current.width === width && current.height === height) {
        return current;
      }

      return {
        width,
        height,
      };
    });
  }, []);

  useWindowEvent('resize', setSize, eventListerOptions);
  useWindowEvent('orientationchange', setSize, eventListerOptions);

  useLayoutEffect(setSize, [setSize]);

  return windowSize;
};
