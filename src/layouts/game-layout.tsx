import React, { useRef } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import ResourcesContainer from 'components/game/navigation/resources-container';
import { useContextSelector } from 'use-context-selector';
import { GameContext } from 'providers/game/game-context';
import NavigationButton, { NavigationButtonVariant } from 'components/game/navigation/navigation-button';
import TroopPopulationCounter from 'components/game/navigation/population-counters/troop-population-counter';
import PopulationCounter from 'components/game/navigation/population-counters/population-counter';
import ReportsContainer from 'components/game/navigation/reports-container';
import Button from 'components/common/buttons/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDiscord, faGithub } from '@fortawesome/free-brands-svg-icons';
import { faPowerOff, faGear } from '@fortawesome/free-solid-svg-icons';
import Tooltip from 'components/common/tooltip';
import { ModalContext } from 'providers/modal-context';
import UserPreferences from 'components/user-preferences';
import { useTranslation } from 'react-i18next';

type MainNavigationLinks = {
  to: string;
  label: string;
  variant: NavigationButtonVariant
};

const GameLayout: React.FC = (): JSX.Element => {
  const navigate = useNavigate();
  const navigation = useRef<HTMLElement>(null);
  const mainNavigationSection = useRef<HTMLDivElement>(null);
  const hasGameDataLoaded = useContextSelector(GameContext, (v) => v.hasGameDataLoaded);
  const logout = useContextSelector(GameContext, (v) => v.logout);
  const openModal = useContextSelector(ModalContext, (v) => v.openModal);
  const { t } = useTranslation();

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

  const openPreferencesModal = (children: React.ReactNode) => {
    return () => openModal(children);
  };

  const openGithub = (): void => {
    window.location.href = 'https://github.com/jurerotar/crylite';
  };

  const openDiscord = (): void => {
    window.location.href = 'https://github.com/jurerotar/crylite';
  };

  const logoutToHomepage = (): void => {
    logout();
    navigate('/');
  };

  return !hasGameDataLoaded ? (
    <p>Loading</p>
  ) : (
    <>
      <nav
        className="flex relative h-[4.5rem] z-10 shadow-md"
        ref={navigation}
      >
        <div className="flex absolute top-0 left-0 w-full h-1/2 bg-blue-500 transition-colors duration-default dark:bg-slate-900" />
        <div className="flex absolute bottom-0 left-0 w-full h-1/2 bg-blue-200 transition-colors duration-default dark:bg-slate-900" />
        <div className="container mx-auto flex justify-between relative">
          <div className="" />
          {/* Center section */}
          <div
            className="overflow-x-scroll scrollbar-hidden z-10 flex w-fit gap-4 md:gap-8 relative md:absolute md:top-0 md:left-1/2 md:-translate-x-1/2"
            ref={mainNavigationSection}
          >
            {/* Troop and general population counters */}
            <div className="flex gap-2 items-start pt-1">
              <TroopPopulationCounter />
              <PopulationCounter />
            </div>
            {/* Main navigation items */}
            <ul className="flex gap-2 items-center z-20 md:mt-1">
              {/* <li className="flex"> */}
              {/*   <HeroInterfaceButton onClick={() => {}} /> */}
              {/* </li> */}
              {mainNavigationLinks.map((link) => (
                <li
                  className="flex"
                  key={link.to}
                >
                  <Link to={link.to}>
                    <NavigationButton
                      onClick={() => {
                      }}
                      variant={link.variant}
                      size="lg"
                    />
                  </Link>
                </li>
              ))}
            </ul>
            {/* Hero interface and reports */}
            <div className="flex gap-2 items-center">
              <ReportsContainer />
            </div>
          </div>
          <div className="gap-2 flex-end items-start hidden md:flex">
            <Tooltip tooltipContent={t('PREFERENCES.MODAL.TOOLTIP_LABEL')}>
              <Button
                onClick={openPreferencesModal((
                  <UserPreferences />
                ))}
                size="xs"
                className="bg-gray-800 dark:bg-gray-600 rounded-t-none"
              >
                <FontAwesomeIcon icon={faGear} />
              </Button>
            </Tooltip>
            <Tooltip tooltipContent="Raise an issue or contribute on GitHub">
              <Button
                onClick={openGithub}
                size="xs"
                className="bg-gray-800 dark:bg-gray-600 rounded-t-none"
              >
                <FontAwesomeIcon icon={faGithub} />
              </Button>
            </Tooltip>
            <Tooltip tooltipContent="Join the community on Discord">
              <Button
                onClick={openDiscord}
                size="xs"
                className="bg-gray-800 dark:bg-gray-600 rounded-t-none"
              >
                <FontAwesomeIcon icon={faDiscord} />
              </Button>
            </Tooltip>
            <Tooltip tooltipContent="Logout">
              <Button
                size="xs"
                className="bg-gray-800 dark:bg-gray-600 rounded-t-none"
                onClick={logoutToHomepage}
              >
                <FontAwesomeIcon icon={faPowerOff} />
              </Button>
            </Tooltip>
          </div>
        </div>
        <div className="inline-flex justify-center gap-2 absolute top-[4.5rem] left-1/2 -translate-x-1/2 w-full sm:w-fit sm:p-2 bg-white">
          <ResourcesContainer />
        </div>
      </nav>
      <Outlet
        context={{
          navigationElement: navigation
        }}
      />
    </>
  );
};

export default GameLayout;
