import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useRef,
} from 'react';

type UseLongPressEvent = {
  onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (e: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (e: ReactPointerEvent<HTMLElement>) => void;
  onPointerCancel: (e: ReactPointerEvent<HTMLElement>) => void;
  onLostPointerCapture: () => void;
  onContextMenu: (e: ReactMouseEvent) => void;
};

const onContextMenu = (e: ReactMouseEvent) => {
  e.preventDefault();
};

const moveCancelDistance = 8;

const getPointerPosition = (event: ReactPointerEvent<HTMLElement>) => ({
  x: event.clientX,
  y: event.clientY,
});

export const useLongPress = (
  callback: (e: ReactPointerEvent<HTMLElement>) => void,
  ms = 1500,
): UseLongPressEvent => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const startPositionRef = useRef<{ x: number; y: number } | null>(null);
  const isCallbackExecuted = useRef(false);

  const start = (
    e: ReactPointerEvent<HTMLElement>,
    position: { x: number; y: number },
  ) => {
    if (isCallbackExecuted.current || timeoutRef.current !== null) {
      return;
    }

    pointerIdRef.current = e.pointerId;
    startPositionRef.current = position;
    e.currentTarget.setPointerCapture?.(e.pointerId);

    timeoutRef.current = setTimeout(() => {
      callback(e);
      isCallbackExecuted.current = true;
    }, ms);
  };

  const stop = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    pointerIdRef.current = null;
    startPositionRef.current = null;
    isCallbackExecuted.current = false;
  };

  const cancelIfMoved = (position: { x: number; y: number }): void => {
    const startPosition = startPositionRef.current;

    if (startPosition === null) {
      return;
    }

    const deltaX = position.x - startPosition.x;
    const deltaY = position.y - startPosition.y;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance >= moveCancelDistance) {
      stop();
    }
  };

  const stopPointer = (e: ReactPointerEvent<HTMLElement>) => {
    if (
      pointerIdRef.current !== null &&
      e.currentTarget.hasPointerCapture?.(pointerIdRef.current)
    ) {
      e.currentTarget.releasePointerCapture?.(pointerIdRef.current);
    }
    stop();
  };

  return {
    onPointerDown: (e) => {
      if (!e.isPrimary || e.button !== 0) {
        return;
      }

      start(e, getPointerPosition(e));
    },
    onPointerMove: (e) => {
      if (pointerIdRef.current !== e.pointerId) {
        return;
      }

      cancelIfMoved(getPointerPosition(e));
    },
    onPointerUp: stopPointer,
    onPointerCancel: stopPointer,
    onLostPointerCapture: stop,
    onContextMenu,
  };
};
