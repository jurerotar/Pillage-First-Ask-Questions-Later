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

    const container = containerRef.current;
    const target = targetRef.current;

    if (!container || !target) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    const targetCenter =
      targetRect.left - containerRect.left + target.offsetWidth / 2;

    const scrollLeft = targetCenter - container.clientWidth / 2;
    // TODO: Not sure this is even an error at all, but we need to keep it disabled for now. Worst case scenario we get rid of this hook and just move the functionality to the layout directly
    // eslint-disable-next-line react-compiler/react-compiler
    container.scrollLeft = scrollLeft;

    initialized.current = true;
  }, [containerRef, targetRef]);
};
