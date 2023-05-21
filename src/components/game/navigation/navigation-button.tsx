import React, { ButtonHTMLAttributes, useMemo } from 'react';
import { breakpoints } from 'constants/breakpoints';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWheatAwn, faCity, faMapLocation, faListCheck, faShield, faUsers, faHandFist } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import clsx from 'clsx';
import { useWindowSize } from 'usehooks-ts';

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

export const NavigationButton: React.FC<NavigationButtonProps> = (props) => {
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

  const buttonSize = useMemo<string>(() => {
    const sizes: Sizes = {
      sm: 'w-10 h-10 p-1',
      md: 'w-16 h-16 p-3',
      lg: 'w-16 h-16 p-3'
    };

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
      className={clsx(buttonSize, isActive ? 'bg-green-100' : 'border-gray-200', 'duration-default flex h-fit items-center justify-center rounded-full border-[6px] bg-gray-100 transition-colors dark:bg-neutral-900')}
      onClick={onClick}
      type="button"
    >
      <FontAwesomeIcon
        className={clsx(navigationButtonContent[variant].color, 'flex h-full w-full items-center justify-center')}
        icon={navigationButtonContent[variant].icon}
      />
    </button>
  );
};
