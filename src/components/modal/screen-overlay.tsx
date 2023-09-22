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
      timeout={300}
      classNames="fade"
    >
      <div
        className={clsx(show ? 'pointer-events-auto flex' : 'pointer-events-none hidden', className, 'fixed left-0 top-0 z-20 h-screen w-screen backdrop-brightness-50 transition-opacity duration-300')}
      >
        {children}
      </div>
    </CSSTransition>
  );
};
