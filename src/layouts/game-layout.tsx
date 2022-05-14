import React, { useRef } from 'react';
import { Link, Outlet } from 'react-router-dom';
import ResourcesContainer from 'components/game/navigation/resources-container';
import { useContextSelector } from 'use-context-selector';
import { GameContext } from 'providers/game/game-context';
import NavigationButton, { NavigationButtonVariant } from 'components/game/navigation/navigation-button';
import TroopPopulationCounter from 'components/game/navigation/population-counters/troop-population-counter';
import PopulationCounter from 'components/game/navigation/population-counters/population-counter';
import ReportsContainer from 'components/game/navigation/reports-container';

type MainNavigationLinks = {
  to: string;
  label: string;
  variant: NavigationButtonVariant
};

const GameLayout: React.FC = (): JSX.Element => {
  const navigation = useRef<HTMLElement>(null);
  const mainNavigationSection = useRef<HTMLDivElement>(null);
  const hasGameDataLoaded = useContextSelector(GameContext, (v) => v.hasGameDataLoaded);

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

  return !hasGameDataLoaded ? (
    <p>Loading</p>
  ) : (
    <>
      <nav
        className="flex relative h-[4.5rem] z-10 shadow-md"
        ref={navigation}
      >
        <div className="flex absolute top-0 left-0 w-full h-1/2 bg-blue-500" />
        <div className="flex absolute bottom-0 left-0 w-full h-1/2 bg-blue-200" />
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
            <ul className="flex gap-2 items-center z-20">
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
          <div className="" />
        </div>
        <div className="inline-flex justify-center gap-2 absolute top-[4.5rem] left-1/2 -translate-x-1/2 w-full sm:w-fit sm:p-2 bg-white">
          <ResourcesContainer />
        </div>
      </nav>
      <div className="mt-4 sm:mt-8 md:mt-0">
        <Outlet
          context={{
            navigationElement: navigation
          }}
        />
      </div>
    </>
  );
};

export default GameLayout;
