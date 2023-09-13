import React, { ReactElement, ReactNode, useCallback, useRef, useState } from 'react';
import { createContext } from 'use-context-selector';
import { Modal, PassableModalProps } from 'components/modal/modal';

type ModalProviderValues = {
  openModal: (children: ReactNode, passableModalProps: PassableModalProps) => void;
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
  const modalProps = useRef<PassableModalProps | null>(null);

  const openModal = useCallback((modalContent: ReactNode, passableModalProps: PassableModalProps): void => {
    modalProps.current = passableModalProps;
    setModalChildren(modalContent);
  }, []);

  const closeModal = useCallback((): void => {
    setModalChildren(() => null);
    modalProps.current = null;
  }, []);

  const value: ModalProviderValues = {
    openModal,
    closeModal
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
      <Modal
        show={!!modalChildren}
        closeHandler={closeModal}
        {...(modalProps.current ?? {})}
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
