import React, { ButtonHTMLAttributes, useMemo } from 'react';
import useWindowSize from 'utils/hooks/use-window-size';
import breakpoints from 'utils/constants/breakpoints';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWheatAwn, faCity, faMapLocation, faListCheck, faShield, faUsers, faHandFist } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export type NavigationButtonVariant = 'resources' | 'village' | 'map' | 'reports' | 'troop-count' | 'population-count' | 'hero-interface';

type NavigationButtonProps = {
  onClick: () => void;
  variant: NavigationButtonVariant;
  size: 'sm' | 'md' | 'lg';
  isActive?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

type NavigationButtonContent = {
  [key in NavigationButtonProps['variant']]: {
    icon: IconDefinition,
    color: string;
  };
};

type Sizes = {
  [key in NavigationButtonProps['size']]: string;
};

const NavigationButton: React.FC<NavigationButtonProps> = (props): JSX.Element => {
  const {
    onClick,
    variant,
    size,
    isActive = false
  } = props;

  const { width } = useWindowSize();

  // TODO: Replace with svg eventually
  const navigationButtonContent: NavigationButtonContent = {
    resources: {
      icon: faWheatAwn,
      color: 'text-yellow-300'
    },
    village: {
      icon: faCity,
      color: 'text-gray-400'
    },
    map: {
      icon: faMapLocation,
      color: 'text-green-500'
    },
    reports: {
      icon: faListCheck,
      color: 'dark:text-gray-200'
    },
    'troop-count': {
      icon: faShield,
      color: 'text-blue-500'
    },
    'population-count': {
      icon: faUsers,
      color: 'text-brown-500'
    },
    'hero-interface': {
      icon: faHandFist,
      color: ''
    }
  };

  const sizes: Sizes = {
    sm: 'w-10 h-10 p-1',
    md: 'w-16 h-16 p-3',
    lg: 'w-16 h-16 p-3'
  };

  const buttonSize = useMemo<string>(() => {
    if (size === 'sm') {
      return sizes.sm;
    }
    if (width <= breakpoints.sm) {
      return sizes.md;
    }
    return sizes[size];
  }, [width, size]);

  return (
    <button
      className={`flex justify-center items-center h-fit border-[6px] rounded-full bg-gray-100 dark:bg-neutral-900 transition-colors duration-default ${buttonSize} ${isActive ? 'bg-green-100' : 'border-gray-200'}`}
      onClick={onClick}
      type="button"
    >
      <FontAwesomeIcon
        className={`flex justify-center items-center h-full w-full ${navigationButtonContent[variant].color}`}
        icon={navigationButtonContent[variant].icon}
      />
    </button>
  );
};

export default NavigationButton;
