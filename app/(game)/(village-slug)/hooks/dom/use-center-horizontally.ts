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

    // Get bounding rectangles
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    // Compute the target center relative to the container
    const targetCenter =
      targetRect.left - containerRect.left + target.offsetWidth / 2;

    // Scroll so that the target center aligns with the container center
    const scrollLeft = targetCenter - container.clientWidth / 2;
    container.scrollLeft = scrollLeft;

    initialized.current = true;
  }, [containerRef, targetRef]);
};
