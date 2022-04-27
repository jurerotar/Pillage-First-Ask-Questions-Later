import React, { useRef } from 'react';
import { Outlet } from 'react-router-dom';
import MainNavigationItem from 'components/game/navigation/main-navigation-item';
import ResourcesContainer from 'components/game/navigation/resources-container';

const GameLayout: React.FC = (): JSX.Element => {
  const navigation = useRef<HTMLElement>(null);

  const mainNavigationLinks = [
    {
      to: '/resources',
      label: '',
      image: '/images/main_navigation_resources.png'
    },
    {
      to: '/village',
      label: '',
      image: '/images/main_navigation_map.png'
    },
    {
      to: '/map',
      label: '',
      image: '/images/main_navigation_village.png'
    },
    {
      to: '/reports',
      label: '',
      image: '/images/main_navigation_resources.png'
    }
  ];

  return (
    <>
      <nav className="w-full flex" ref={navigation}>
        <div className="container mx-auto flex flex-col justify-between p-4 border border-red-300">
          <ul className="flex justify-evenly gap-2">
            {mainNavigationLinks.map((link) => (
              <li
                className=""
                key={link.to}
              >
                <MainNavigationItem
                  to={link.to}
                  imageUrl={link.image}
                  label={link.label}
                />
              </li>
            ))}
          </ul>
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
