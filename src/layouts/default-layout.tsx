import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HamburgerButton from 'components/common/buttons/hamburger-button';
import { useContextSelector } from 'use-context-selector';
import { ModalContext } from 'providers/modal-context';

const DefaultLayout: React.FC = (): JSX.Element => {
  const { t } = useTranslation();
  const openModal = useContextSelector(ModalContext, (v) => v.openModal);

  return (
    <div className="transition-colors duration-default bg-gray-200 dark:bg-stone-700">
      <nav className="w-full flex absolute top-0 left-0 z-10">
        <div className="container mx-auto flex justify-between py-2 px-4">
          <div className="flex flex-col gap-1">
            <span className="font-permanent-marker transition-colors duration-default dark:text-gray-200 leading-none text-2xl">
              Crylite
            </span>
            <span className="font-permanent-marker transition-colors duration-default dark:text-gray-200 text-sm">
              {t('META.SLOGAN')}
            </span>
          </div>
          <div className="hidden md:flex gap-4">

          </div>
          <div className="hidden md:flex">

          </div>
          <div className="flex md:hidden items-center">
            <HamburgerButton
              className="rounded-full bg-gray-200 bg-opacity-30 h-min"
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

export default DefaultLayout;
