import { useEffect, useState } from 'react';
import { Device } from 'interfaces/models/common/device';

const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState<Device['size']>({
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
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

export default useWindowSize;
