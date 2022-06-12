import React, { ReactElement, ReactNode, useMemo, useState } from 'react';
import { createContext } from 'use-context-selector';
import Modal from 'components/common/modal/modal';

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

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalChildren, setModalChildren] = useState<ReactNode | null>(null);
  const [modalClassname, setModalClassname] = useState<string>('');

  const openModal = (modalContent: ReactNode, className: string = ''): void => {
    setIsModalOpen(true);
    setModalChildren(modalContent);
    setModalClassname(className);
  };

  const closeModal = (): void => {
    setIsModalOpen(false);
    setModalChildren(null);
    setModalClassname('');
  };

  const value = useMemo<ModalProviderValues>(() => {
    return {
      openModal,
      closeModal
    };
  }, []);

  return (
    <ModalContext.Provider value={value}>
      {children}
      <Modal
        className={modalClassname}
        show={isModalOpen && !!modalChildren}
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
