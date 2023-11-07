import { useState } from 'react';

export const useDialog = (isOpenInitially: boolean = false) => {
  const [isOpen, setIsOpen] = useState<boolean>(isOpenInitially);

  const closeModal = () => {
    setIsOpen(false);
  };

  const openModal = () => {
    setIsOpen(true);
  };

  const toggleModal = () => {
    setIsOpen((prevState) => !prevState);
  };

  return {
    isOpen,
    closeModal,
    openModal,
    toggleModal
  }
}
