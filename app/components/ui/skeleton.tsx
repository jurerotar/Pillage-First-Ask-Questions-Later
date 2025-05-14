import type React from 'react';
import clsx from 'clsx';

export const Skeleton: React.FC<React.ComponentProps<'div'>> = ({ className, ...props }) => {
  return (
    <div
      data-slot="skeleton"
      className={clsx('bg-gray-200 animate-pulse rounded-md', className)}
      {...props}
    />
  );
};
