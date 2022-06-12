import { RefObject, useEffect } from 'react';

const onHover = (ref: RefObject<HTMLElement>, onMouseEnter: () => void, onMouseLeave?: () => void): void => {
  useEffect(() => {
    const immutableRef = ref.current;
    if (immutableRef) {
      immutableRef.addEventListener('mouseenter', onMouseEnter);
      immutableRef.addEventListener('mouseleave', onMouseLeave ?? onMouseEnter);
    }
    return () => {
      immutableRef?.removeEventListener('mouseenter', onMouseEnter);
      immutableRef?.removeEventListener('mouseleave', onMouseLeave ?? onMouseEnter);
    };
  }, [ref, onMouseEnter, onMouseLeave]);
};

export default onHover;
