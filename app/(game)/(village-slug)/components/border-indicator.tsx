import clsx from 'clsx';
import type React from 'react';

export type BorderIndicatorBorderVariant = 'green' | 'blue' | 'red' | 'gray' | 'yellow' | 'purple' | 'orange';
export type BorderIndicatorBackgroundVariant = 'orange' | 'white';

export type BorderIndicatorProps = {
  variant?: BorderIndicatorBorderVariant;
  backgroundVariant: BorderIndicatorBackgroundVariant;
} & React.HTMLProps<HTMLDivElement>;

const borderVariantToClassNameMap: Record<BorderIndicatorBorderVariant, string> = {
  green: 'from-[#7da100] to-[#c7e94f]',
  blue: 'from-[#0d648e] to-[#b1e4ff]',
  red: 'from-[#D40000] to-[#F58C8C]',
  yellow: 'from-[#988b42] to-[#fdf15f]',
  gray: 'from-[#606060] to-[#c8c8c8]',
  purple: 'from-[#6a0dad] to-[#dcb4ff]',
  orange: 'from-[#e67e22] to-[#ffd7a1]',
};

const backgroundVariantToClassNameMap: Record<BorderIndicatorBackgroundVariant, string> = {
  orange: 'bg-yellow-400',
  white: 'bg-white',
};

export const BorderIndicator: React.FCWithChildren<BorderIndicatorProps> = (props) => {
  const { variant = 'gray', backgroundVariant, className, children, ...rest } = props;

  return (
    <span
      className={clsx(
        className,
        borderVariantToClassNameMap[variant],
        'inline-flex items-center justify-center rounded-full bg-gradient-to-t p-1 scale-75 md:scale-100',
      )}
      {...rest}
    >
      <span
        className={clsx(
          !backgroundVariant ? 'bg-white' : backgroundVariantToClassNameMap[backgroundVariant],
          'relative inline-flex size-5 items-center justify-center rounded-full bg-white text-xs',
        )}
      >
        {children}
      </span>
    </span>
  );
};
