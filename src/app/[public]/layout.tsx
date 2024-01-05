import React, { lazy } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HamburgerButton } from 'components/buttons/hamburger-button';
import { Button } from 'components/buttons/button';
import { useDialog } from 'hooks/utils/use-dialog';
import { Modal } from 'components/modal/modal';

const CreateServerModalContent = lazy(async () => ({
  default: (await import('./components/create-server-modal-content')).CreateServerModalContent,
}));

export const PublicLayout: React.FC = () => {
  const { t } = useTranslation();
  const { isOpen: isCreateServerModalOpen, openModal: openCreateServerModal, closeModal: closeCreateServerModal } = useDialog();

  return (
    <div className="bg-gray-100 transition-colors">
      <nav className="relative z-10 flex w-full bg-white">
        <div className="container mx-auto flex justify-between px-4 py-2">
          <div className="flex flex-col gap-1">
            <span className="text-2xl font-semibold leading-none dark:text-gray-200">Crylite</span>
            <span className="text-sm dark:text-gray-200">{t('META.SLOGAN')}</span>
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <span>Unused link 1</span>
            <span>Unused link 2</span>
            <span>Unused link 3</span>
          </div>
          <div className="hidden md:flex">
            <Button
              size="xs"
              onClick={() => openCreateServerModal()}
            >
              Create new server
            </Button>
          </div>
          <div className="flex items-center md:hidden">
            <HamburgerButton
              className="h-min rounded-full bg-gray-200/30"
              onClick={() => {}}
            />
          </div>
        </div>
      </nav>
      <Outlet />
      <Modal
        isOpen={isCreateServerModalOpen}
        closeHandler={closeCreateServerModal}
      >
        <CreateServerModalContent />
      </Modal>
      {/* <footer className="w-full flex bg-blue-500"> */}
      {/*   <div className="container mx-auto p-4"> */}
      {/*     Footer */}
      {/*   </div> */}
      {/* </footer> */}
    </div>
  );
};
