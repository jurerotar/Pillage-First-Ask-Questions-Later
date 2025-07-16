import { type RefObject, useLayoutEffect, useRef } from 'react';

export const useCenterHorizontally = (
  containerRef: RefObject<HTMLElement | null>,
  targetRef: RefObject<HTMLElement | null>,
) => {
  const initialized = useRef<boolean>(false);

  useLayoutEffect(() => {
    if (initialized.current) {
      return;
    }
    if (!containerRef.current || !targetRef.current) {
      return;
    }

    const container = containerRef.current;
    const target = targetRef.current;

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    const targetCenter =
      targetRect.left - containerRect.left + target.offsetWidth / 2;

    const scrollLeft = targetCenter - container.clientWidth / 2;
    container.scrollLeft = scrollLeft;

    initialized.current = true;
  }, [containerRef, targetRef]);
};
