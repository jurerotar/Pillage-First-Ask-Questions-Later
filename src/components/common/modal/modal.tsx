import React, { useRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import { CloseButton } from 'components/common/buttons/close-button';
import { ScreenOverlay } from 'components/common/modal/screen-overlay';
import { useOnClickOutside } from 'utils/events/on-click-outside';
import clsx from 'clsx';

type ModalProps = {
  show: boolean;
  closeHandler: () => void;
  children: React.ReactNode;
  className?: string;
};

export const Modal: React.FC<ModalProps> = (props) => {
  const {
    show,
    closeHandler,
    children,
    className = ''
  } = props;

  const ref = useRef<HTMLDivElement>(null);

  useOnClickOutside(ref, closeHandler);

  return (
    <ScreenOverlay show={show}>
      <CSSTransition
        in={show}
        nodeRef={ref}
        timeout={0}
        classNames="fade"
      >
        <div
          ref={ref}
          tabIndex={-1}
          className={clsx(show ? 'pointer-events-auto flex' : 'pointer-events-none hidden', className, 'scrollbar duration-default fixed inset-4 z-50 h-full max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-screen-md overflow-y-auto overflow-x-hidden rounded-md bg-white p-4 transition-colors dark:bg-gray-700 md:top-1/2 md:left-1/2 md:max-h-[calc(600px-2rem)] md:w-[calc(100%-8rem)] md:-translate-x-1/2 md:-translate-y-1/2')}
        >
          <div className="relative h-full w-full">
            <div className="absolute right-0 top-0">
              <CloseButton onClick={closeHandler} />
            </div>
            {children}
          </div>
        </div>
      </CSSTransition>
    </ScreenOverlay>
  );
};
