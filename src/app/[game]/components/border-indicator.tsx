import clsx from 'clsx';
import type React from 'react';
import type { FCWithChildren } from 'react';

export type BorderIndicatorVariant = 'green' | 'blue' | 'red' | 'gray' | 'yellow';

export type BorderIndicatorProps = {
  variant?: BorderIndicatorVariant;
} & React.HTMLProps<HTMLDivElement>;

const variantToClassNameMap: Record<BorderIndicatorVariant, string> = {
  green: 'from-[#7da100] to-[#c7e94f]',
  blue: 'from-[#0d648e] to-[#b1e4ff]',
  red: 'from-[#D40000] to-[#F58C8C]',
  yellow: 'from-[#988b42] to-[#fdf15f]',
  gray: 'from-[#606060] to-[#c8c8c8]',
};

export const BorderIndicator: FCWithChildren<BorderIndicatorProps> = (props) => {
  const { variant = 'gray', className, children, ...rest } = props;

  return (
    <span
      className={clsx(
        className,
        variantToClassNameMap[variant],
        'inline-flex items-center justify-center rounded-full bg-gradient-to-t p-1'
      )}
      {...rest}
    >
      <span className="relative inline-flex size-5 items-center justify-center rounded-full bg-white text-xs">{children}</span>
    </span>
  );
};
