import React, { useRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import { CloseButton } from 'components/buttons/close-button';
import { ScreenOverlay } from 'components/modal/screen-overlay';
import clsx from 'clsx';
import { useOnClickOutside } from 'usehooks-ts';
import { SectionHeading } from 'components/section-heading';

type ModalProps = {
  show: boolean;
  closeHandler: () => void;
  children: React.ReactNode;
  className?: string;
  title?: string;
  hasTitle?: boolean;
};

export type PassableModalProps = Omit<ModalProps, 'children' | 'show' | 'closeHandler'>;

export const Modal: React.FC<ModalProps> = (props) => {
  const {
    show,
    closeHandler,
    children,
    className = '',
    title,
    hasTitle = true
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
          className={clsx(show ? 'pointer-events-auto flex' : 'pointer-events-none hidden', className, 'scrollbar fixed inset-4 z-50 h-full max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-screen-md overflow-y-auto overflow-x-hidden rounded-md bg-white p-4 dark:bg-gray-700 md:left-1/2 md:top-1/2 md:max-h-[calc(600px-2rem)] md:w-[calc(100%-8rem)] md:-translate-x-1/2 md:-translate-y-1/2')}
        >
          <div className="relative h-full w-full">
            {/* Modal header */}
            {hasTitle && (
              <div className="mb-2 border-b border-gray-300">
                {/* Modal title */}
                <div className="flex max-w-[90%] items-center pb-2">
                  <SectionHeading>
                    {title}
                  </SectionHeading>
                </div>
              </div>
            )}
            {/* Close button */}
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
