import { useCallback, useState } from 'react';

export const useDialog = (isOpenInitially: boolean = false) => {
  const [isOpen, setIsOpen] = useState<boolean>(isOpenInitially);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openModal = useCallback(() => {
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
  };
};
