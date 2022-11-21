import React, { useRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import clsx from 'clsx';

type ScreenOverlayProps = {
  show: boolean;
  className?: string;
  children?: React.ReactNode;
};

export const ScreenOverlay: React.FC<ScreenOverlayProps> = (props) => {
  const {
    show,
    className = '',
    children
  } = props;

  const ref = useRef<HTMLDivElement>(null);

  return (
    <CSSTransition
      nodeRef={ref}
      in={show}
      timeout={0}
      classNames="fade"
    >
      <div
        className={clsx(show ? 'pointer-events-auto flex' : 'pointer-events-none hidden', className, 'fixed top-0 left-0 z-20 h-screen w-screen bg-gray-700 backdrop-blur-xs')}
        style={{
          backgroundColor: 'rgba(55, 65, 81, 0.3)'
        }}
      >
        {children}
      </div>
    </CSSTransition>
  );
};
