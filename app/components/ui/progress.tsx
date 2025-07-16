import type React from 'react';
import { Progress as ProgressPrimitive } from 'radix-ui';
import clsx from 'clsx';

export const Progress: React.FC<
  React.ComponentProps<typeof ProgressPrimitive.Root>
> = ({ className, value, ...props }) => {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={clsx(
        'bg-primary/20 relative h-2 w-full overflow-hidden rounded-full',
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-primary h-full w-full flex-1 transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
};

export const VerticalProgress: React.FC<
  React.ComponentProps<typeof ProgressPrimitive.Root>
> = ({ className, value = 0, ...props }) => {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={clsx(
        'relative w-2 h-full bg-primary/20 overflow-hidden rounded',
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="absolute bottom-0 left-0 w-full bg-primary transition-all"
        style={{ height: `${value}%` }}
      />
    </ProgressPrimitive.Root>
  );
};
