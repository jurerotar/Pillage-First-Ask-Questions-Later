import React, { useRef } from 'react';
import { CSSTransition } from 'react-transition-group';

type ScreenOverlayProps = {
  show: boolean;
  className?: string;
  children?: React.ReactNode;
};

const ScreenOverlay: React.FC<ScreenOverlayProps> = (props): JSX.Element => {
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
        className={`h-screen w-screen backdrop-blur-xs z-20 fixed top-0 left-0 bg-gray-700 ${show ? 'pointer-events-auto flex' : 'pointer-events-none hidden'} ${className}`}
        style={{
          backgroundColor: 'rgba(55, 65, 81, 0.3)'
        }}
      >
        {children}
      </div>
    </CSSTransition>
  );
};

export default ScreenOverlay;
