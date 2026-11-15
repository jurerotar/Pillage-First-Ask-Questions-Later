import { startTransition, useCallback, useState } from 'react';

export const useDialog = <TArgs = unknown>(isOpenInitially = false) => {
  const [state, setState] = useState<{
    isOpen: boolean;
    hasOpened: boolean;
    data: TArgs | null;
  }>({
    isOpen: isOpenInitially,
    hasOpened: isOpenInitially,
    data: null,
  });

  const closeModal = useCallback(() => {
    startTransition(() => {
      setState((previous) => ({ ...previous, isOpen: false, data: null }));
    });
  }, []);

  const openModal = useCallback((args?: TArgs) => {
    startTransition(() => {
      setState({ isOpen: true, hasOpened: true, data: args ?? null });
    });
  }, []);

  const toggleModal = useCallback(() => {
    setState((previous) => ({
      ...previous,
      hasOpened: true,
      isOpen: !previous.isOpen,
    }));
  }, []);

  return {
    ...state,
    closeModal,
    openModal,
    toggleModal,
  };
};
