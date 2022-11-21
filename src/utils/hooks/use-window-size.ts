import { useEffect, useState } from 'react';
import { Size } from 'interfaces/models/common';
import { debounce } from 'utils/common';

export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState<Size>({
    width: 0,
    height: 0
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    const debouncedResizeHandler = debounce(handleResize);

    window.addEventListener('resize', debouncedResizeHandler);
    handleResize();
    return () => window.removeEventListener('resize', debouncedResizeHandler);
  }, []);

  return windowSize;
};
