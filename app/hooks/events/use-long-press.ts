import {
  useRef,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from 'react';

type UseLongPressEvent = {
  onMouseDown: (e: ReactMouseEvent | ReactTouchEvent) => void;
  onMouseUp: (e: ReactMouseEvent | ReactTouchEvent) => void;
  onTouchStart: (e: ReactTouchEvent) => void;
  onTouchEnd: (e: ReactTouchEvent) => void;
};

export const useLongPress = (
  callback: (e: ReactMouseEvent | ReactTouchEvent) => void,
  ms = 1500,
): UseLongPressEvent => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<number | null>(null);
  const isCallbackExecuted = useRef(false);

  const start = (e: ReactMouseEvent | ReactTouchEvent) => {
    // Prevent further execution if the callback has already run
    if (isCallbackExecuted.current) {
      return;
    }

    startRef.current = Date.now();
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
    isCallbackExecuted.current = false;
  };

  const onMouseDown = (e: ReactMouseEvent | ReactTouchEvent) => {
    if (e.type === 'mousedown' || e.type === 'touchstart') {
      start(e);
    }
  };

  const onTouchStart = (e: ReactTouchEvent) => {
    if (e.cancelable) {
      e.preventDefault();
    }
    start(e);
  };

  return {
    onMouseDown,
    onMouseUp: stop,
    onTouchStart,
    onTouchEnd: stop,
  };
};
