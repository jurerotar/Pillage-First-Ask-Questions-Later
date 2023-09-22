import React, { FunctionComponentWithChildren, useRef } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useContextSelector } from 'use-context-selector';
import { Button } from 'components/buttons/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDiscord, faGithub } from '@fortawesome/free-brands-svg-icons';
import { faPowerOff, faGear } from '@fortawesome/free-solid-svg-icons';
import { Tooltip } from 'components/tooltip';
import { ModalContext } from 'providers/global/modal-context';
import { UserPreferences } from 'components/user-preferences';
import { useTranslation } from 'react-i18next';
import { useCurrentVillage } from 'hooks/game/use-current-village';
import { ReportsContainer } from './components/navigation/reports-container';
import { PopulationCounter } from './components/navigation/population-counters/population-counter';
import { TroopPopulationCounter } from './components/navigation/population-counters/troop-population-counter';
import { NavigationButton, NavigationButtonVariant } from './components/navigation/navigation-button';
import { ResourcesContainer } from './components/navigation/resources-container';

type MainNavigationLinks = {
  to: string;
  label: string;
  variant: NavigationButtonVariant
};

const mainNavigationLinks: MainNavigationLinks[] = [
  {
    to: '/resources',
    label: 'Resources',
    variant: 'resources'
  },
  {
    to: '/village',
    label: 'Village',
    variant: 'village'
  },
  {
    to: '/map',
    label: 'Map',
    variant: 'map'
  }
];

const openGithub = (): void => {
  window.location.href = 'https://github.com/jurerotar/crylite';
};

const openDiscord = (): void => {
  window.location.href = 'https://github.com/jurerotar/crylite';
};

export const GameLayout = () => {
  const { currentVillage } = useCurrentVillage();

  return (
    <Outlet />
  );

  // const navigate = useNavigate();
  // const navigation = useRef<HTMLElement>(null);
  // const mainNavigationSection = useRef<HTMLDivElement>(null);
  // const openModal = useContextSelector(ModalContext, (v) => v.openModal);
  // const { t } = useTranslation();
  //
  // const openPreferencesModal = (contents: React.ReactNode) => {
  //   return () => openModal(contents);
  // };
  //
  // const logoutToHomepage = (): void => {
  //   navigate('/');
  // };
  //
  // return (
  //   <>
  //     <nav
  //       className="relative z-10 flex h-[4.5rem] shadow-md"
  //       ref={navigation}
  //     >
  //       <div className="duration-default absolute left-0 top-0 flex h-1/2 w-full bg-blue-500 transition-colors dark:bg-slate-900" />
  //       <div className="duration-default absolute bottom-0 left-0 flex h-1/2 w-full bg-blue-200 transition-colors dark:bg-slate-900" />
  //       <div className="container relative mx-auto flex justify-between">
  //         <div className="" />
  //         {/* Center section */}
  //         <div
  //           className="scrollbar-hidden relative z-10 flex w-fit gap-4 overflow-x-scroll md:absolute md:left-1/2 md:top-0 md:-translate-x-1/2 md:gap-8"
  //           ref={mainNavigationSection}
  //         >
  //           {/* Troop and general population counters */}
  //           <div className="flex items-start gap-2 pt-1">
  //             <TroopPopulationCounter />
  //             <PopulationCounter />
  //           </div>
  //           {/* Main navigation items */}
  //           <ul className="z-20 flex items-center gap-2 md:mt-1">
  //             {/* <li className="flex"> */}
  //             {/*   <HeroInterfaceButton onClick={() => {}} /> */}
  //             {/* </li> */}
  //             {mainNavigationLinks.map((link) => (
  //               <li
  //                 className="flex"
  //                 key={link.to}
  //               >
  //                 <Link to={link.to}>
  //                   <NavigationButton
  //                     onClick={() => {
  //                     }}
  //                     variant={link.variant}
  //                     size="lg"
  //                   />
  //                 </Link>
  //               </li>
  //             ))}
  //           </ul>
  //           {/* Hero interface and reports */}
  //           <div className="flex items-center gap-2">
  //             <ReportsContainer />
  //           </div>
  //         </div>
  //         <div className="flex-end hidden items-start gap-2 md:flex">
  //           <Tooltip tooltipContent={t('PREFERENCES.MODAL.TOOLTIP_LABEL')}>
  //             <Button
  //               onClick={openPreferencesModal((
  //                 <UserPreferences />
  //               ))}
  //               size="xs"
  //               className="rounded-t-none bg-gray-800 dark:bg-gray-600"
  //             >
  //               <FontAwesomeIcon icon={faGear} />
  //             </Button>
  //           </Tooltip>
  //           <Tooltip tooltipContent="Raise an issue or contribute on GitHub">
  //             <Button
  //               onClick={openGithub}
  //               size="xs"
  //               className="rounded-t-none bg-gray-800 dark:bg-gray-600"
  //             >
  //               <FontAwesomeIcon icon={faGithub} />
  //             </Button>
  //           </Tooltip>
  //           <Tooltip tooltipContent="Join the community on Discord">
  //             <Button
  //               onClick={openDiscord}
  //               size="xs"
  //               className="rounded-t-none bg-gray-800 dark:bg-gray-600"
  //             >
  //               <FontAwesomeIcon icon={faDiscord} />
  //             </Button>
  //           </Tooltip>
  //           <Tooltip tooltipContent="Logout">
  //             <Button
  //               size="xs"
  //               className="rounded-t-none bg-gray-800 dark:bg-gray-600"
  //               onClick={logoutToHomepage}
  //             >
  //               <FontAwesomeIcon icon={faPowerOff} />
  //             </Button>
  //           </Tooltip>
  //         </div>
  //       </div>
  //       <div className="absolute left-1/2 top-[4.5rem] inline-flex w-full -translate-x-1/2 justify-center gap-2 bg-white sm:w-fit sm:p-2">
  //         <ResourcesContainer />
  //       </div>
  //     </nav>
  //     {children}
  //   </>
  // );
};
