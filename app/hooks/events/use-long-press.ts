import { useRef } from 'react';
import type React from 'react';

type UseLongPressEvent = {
  onMouseDown: (e: React.MouseEvent | React.TouchEvent) => void;
  onMouseUp: (e: React.MouseEvent | React.TouchEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
};

const useLongPress = (callback: (e: React.MouseEvent | React.TouchEvent) => void, ms = 1500): UseLongPressEvent => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<number | null>(null);
  const isCallbackExecuted = useRef(false);

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    if (isCallbackExecuted.current) return; // Prevent further execution if the callback has already run

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

  const onMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.type === 'mousedown' || e.type === 'touchstart') {
      start(e);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
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

export default useLongPress;
