import React, { useRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import CloseButton from 'components/common/buttons/close-button';
import ScreenOverlay from 'components/common/modal/screen-overlay';
import onClickOutside from 'utils/events/on-click-outside';

type ModalProps = {
  show: boolean;
  closeHandler: () => void;
  children: React.ReactNode;
  className?: string;
};

const Modal: React.FC<ModalProps> = (props): JSX.Element => {
  const {
    show,
    closeHandler,
    children,
    className = ''
  } = props;

  const ref = useRef<HTMLDivElement>(null);

  onClickOutside(ref, closeHandler);

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
          className={`overflow-y-auto scrollbar h-full max-h-[calc(100vh-2rem)] md:max-h-[700px] transition-colors duration-default rounded-md bg-white dark:bg-gray-700 p-4 overflow-x-hidden fixed inset-4 md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-50 w-[calc(100%-2rem)] md:w-[calc(100%-8rem)] max-w-screen-md ${show ? 'pointer-events-auto flex' : 'pointer-events-none hidden'} ${className}`}
        >
          <div className="h-full w-full relative">
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

export default Modal;
