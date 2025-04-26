import { useEffect, useRef } from 'react';
import type React from 'react';

export const useWorkerRef = (module: string): React.RefObject<Worker | null> => {
  const ref = useRef<Worker | null>(null);

  useEffect(() => {
    if (!ref.current) {
      ref.current = new Worker(module, { type: 'module' });
    }

    return () => {
      ref.current?.terminate();
      ref.current = null;
    };
  }, [module]);

  return ref;
};
