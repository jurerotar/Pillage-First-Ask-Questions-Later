import React, { FunctionComponentWithChildren } from 'react';
import clsx from 'clsx';

export type BorderIndicatorProps = {
  variant?: 'green' | 'blue' | 'red' | 'gray';
} & React.HTMLProps<HTMLDivElement>;

const variantToClassNameMap = {
  green: 'from-[#7da100] to-[#c7e94f]',
  blue: 'from-[#] to-[#]',
  red: 'from-[#] to-[#]',
  yellow: 'from-[#988b42] to-[#fdf15f]',
  gray: 'border-gray-500'
};

export const BorderIndicator: FunctionComponentWithChildren<BorderIndicatorProps> = (props) => {
  const {
    variant = 'gray',
    className,
    children,
    ...rest
  } = props;

  return (
    <span
      className={clsx(className, variantToClassNameMap[variant], 'inline-flex items-center justify-center rounded-full bg-gradient-radial p-1')}
      {...rest}
    >
      <span className="relative inline-flex items-center justify-center rounded-full bg-white p-1">
        {children}
      </span>
    </span>
  );
};
