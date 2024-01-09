import { useCallback, useRef, useState } from 'react';

export const useDialog = (isOpenInitially: boolean = false) => {
  const [isOpen, setIsOpen] = useState<boolean>(isOpenInitially);
  const modalArgs = useRef<unknown | null>(null);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    modalArgs.current = null;
  }, []);

  const openModal = useCallback((data?: unknown) => {
    modalArgs.current = data ?? null;
    setIsOpen(true);
    }, []);

  const toggleModal = useCallback(() => {
    setIsOpen((prevState) => !prevState);
  }, []);

  return {
    isOpen,
    closeModal,
    openModal,
    toggleModal,
    modalArgs: modalArgs.current,
  };
};
