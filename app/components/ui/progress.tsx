import { Progress as ProgressPrimitive } from '@base-ui/react';
import { clsx } from 'clsx';
import type { ComponentProps } from 'react';

export const Progress = ({
  className,
  value = 0,
  ...props
}: ComponentProps<typeof ProgressPrimitive.Root>) => {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={clsx(
        'bg-primary/20 relative h-2 w-full overflow-hidden rounded-full',
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Track className="bg-muted h-full w-full flex-1">
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className="bg-primary h-full w-full flex-1 transition-all"
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  );
};

export const VerticalProgress = ({
  className,
  value = 0,
  ...props
}: ComponentProps<typeof ProgressPrimitive.Root>) => {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={clsx(
        'relative w-2 h-full bg-primary/20 overflow-hidden rounded',
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Track className="bg-muted h-full w-full flex-1">
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className="absolute bottom-0 left-0 w-full bg-primary transition-all"
          style={{ height: `${value}%` }}
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  );
};
