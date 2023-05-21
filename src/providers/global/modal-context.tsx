import React, { ReactElement, ReactNode, useCallback, useRef, useState } from 'react';
import { createContext } from 'use-context-selector';
import { Modal } from 'components/common/modal/modal';

type ModalProviderValues = {
  openModal: (children: ReactNode) => void;
  closeModal: () => void;
};

type ModalProviderProps = {
  children: React.ReactNode;
};

const ModalContext = createContext<ModalProviderValues>({} as ModalProviderValues);

const ModalProvider: React.FC<ModalProviderProps> = (props): ReactElement => {
  const {
    children
  } = props;

  const [modalChildren, setModalChildren] = useState<ReactNode | null>(null);
  const modalClassname = useRef<string>('');

  const openModal = useCallback((modalContent: ReactNode, className: string = ''): void => {
    setModalChildren(modalContent);
    modalClassname.current = className;
  }, []);

  const closeModal = useCallback((): void => {
    setModalChildren(() => null);
    modalClassname.current = '';
  }, []);

  const value: ModalProviderValues = {
    openModal,
    closeModal
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
      <Modal
        className={modalClassname.current}
        show={!!modalChildren}
        closeHandler={closeModal}
      >
        {modalChildren}
      </Modal>
    </ModalContext.Provider>
  );
};

export {
  ModalContext,
  ModalProvider
};
