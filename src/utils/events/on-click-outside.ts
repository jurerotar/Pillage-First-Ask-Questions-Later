import React, { useEffect } from 'react';

export const useOnClickOutside = (ref: React.RefObject<HTMLElement>, callback: () => void): void => {
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    // Bind the event listener
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [callback, ref]);
};
