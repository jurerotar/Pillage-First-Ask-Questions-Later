import { cn } from 'app/utils/tailwind';
import type React from 'react';

export const Skeleton: React.FC<React.ComponentProps<'div'>> = ({ className, ...props }) => {
  return (
    <div
      data-slot="skeleton"
      className={cn('bg-gray-200 animate-pulse rounded-md', className)}
      {...props}
    />
  );
};
