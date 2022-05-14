import React, { ButtonHTMLAttributes, useMemo } from 'react';
import useWindowSize from 'helpers/hooks/use-window-size';
import breakpoints from 'helpers/constants/breakpoints';

export type NavigationButtonVariant = 'resources' | 'village' | 'map' | 'reports' | 'troop-count' | 'population-count' | 'hero-interface';

type NavigationButtonProps = {
  onClick: () => void;
  variant: NavigationButtonVariant;
  size: 'sm' | 'md' | 'lg';
  isActive?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

type NavigationButtonContent = {
  [key in NavigationButtonProps['variant']]: string;
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
    resources: 'RS',
    village: 'VL',
    map: 'MP',
    reports: 'RE',
    'troop-count': 'TC',
    'population-count': 'PC',
    'hero-interface': 'HI'
  };

  const sizes: Sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14'
  };

  const buttonSize = useMemo(() => {
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
      className={`flex justify-center items-center h-fit border-[6px] rounded-full p-1 bg-white ${isActive ? 'bg-green-100' : 'border-gray-200'}`}
      onClick={onClick}
      type="button"
    >
      <span className={`flex justify-center items-center ${buttonSize}`}>
        {navigationButtonContent[variant]}
      </span>
    </button>
  );
};

export default NavigationButton;
