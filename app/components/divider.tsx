import type React from 'react';
import clsx from 'clsx';

type DividerProps = React.HTMLAttributes<HTMLSpanElement> & {
  orientation?: 'vertical' | 'horizontal';
};

export const Divider: React.FC<DividerProps> = ({
  orientation = 'vertical',
  className,
}) => {
  return (
    <span
      className={clsx(
        orientation === 'vertical' ? 'flex w-1' : 'h-1 w-full',
        className,
        'rounded-md bg-gray-300',
      )}
    />
  );
};
