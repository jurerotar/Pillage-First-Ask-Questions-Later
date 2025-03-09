import { type RefObject, useLayoutEffect, useRef } from 'react';

export const useCenterHorizontally = (ref: RefObject<HTMLElement | null>) => {
  const initialized = useRef<boolean>(false);

  useLayoutEffect(() => {
    if (initialized.current || !ref.current) {
      return;
    }

    const container = ref.current;
    const scrollWidth = container.scrollWidth;
    const containerWidth = container.clientWidth;

    container.scrollLeft = (scrollWidth - containerWidth) / 2;

    initialized.current = true;
  }, [ref]);
};
