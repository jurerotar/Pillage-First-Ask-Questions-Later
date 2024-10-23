import { startTransition, useCallback, useRef, useState } from 'react';

export const useDialog = <TArgs = unknown>(isOpenInitially = false) => {
  const [isOpen, setIsOpen] = useState<boolean>(isOpenInitially);
  const modalArgs = useRef<TArgs | null>(null);

  const closeModal = useCallback(() => {
    startTransition(() => {
      setIsOpen(false);
    });
    modalArgs.current = null;
  }, []);

  const openModal = useCallback((data?: TArgs) => {
    if (data) {
      modalArgs.current = data;
    }

    startTransition(() => {
      setIsOpen(true);
    });
  }, []);

  const toggleModal = useCallback(() => {
    setIsOpen((prevState) => !prevState);
  }, []);

  return {
    isOpen,
    closeModal,
    openModal,
    toggleModal,
    modalArgs,
  };
};
