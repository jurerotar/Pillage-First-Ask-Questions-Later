import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HamburgerButton } from 'components/common/buttons/hamburger-button';
import { useContextSelector } from 'use-context-selector';
import { ModalContext } from 'providers/global/modal-context';
import { Button } from 'components/common/buttons/button';
import { CreateServerModalContent } from 'components/modal-content/public/create-server-modal-content';

export const DefaultLayout: React.FC = () => {
  const { t } = useTranslation();
  const openModal = useContextSelector(ModalContext, (v) => v.openModal);

  return (
    <div className="duration-default bg-gray-100 transition-colors">
      <nav className="relative z-10 flex w-full bg-white">
        <div className="container mx-auto flex justify-between py-2 px-4">
          <div className="flex flex-col gap-1">
            <span className="duration-default text-2xl font-semibold leading-none transition-colors dark:text-gray-200">
              Crylite
            </span>
            <span className="duration-default text-sm transition-colors dark:text-gray-200">
              {t('META.SLOGAN')}
            </span>
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <span>
              Unused link 1
            </span>
            <span>
              Unused link 2
            </span>
            <span>
              Unused link 3
            </span>
          </div>
          <div className="hidden md:flex">
            <Button
              size="xs"
              onClick={() => openModal((
                <CreateServerModalContent />
              ))}
            >
              Create new server
            </Button>
          </div>
          <div className="flex items-center md:hidden">
            <HamburgerButton
              className="h-min rounded-full bg-gray-200/30"
              onClick={() => openModal((
                <></>
              ))}
            />
          </div>
        </div>
      </nav>
      <Outlet />
      {/* <footer className="w-full flex bg-blue-500"> */}
      {/*   <div className="container mx-auto p-4"> */}
      {/*     Footer */}
      {/*   </div> */}
      {/* </footer> */}
    </div>
  );
};
