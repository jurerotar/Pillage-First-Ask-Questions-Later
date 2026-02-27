import { Progress as ProgressPrimitive } from '@base-ui/react';
import { clsx } from 'clsx';

export const Progress = (props: ProgressPrimitive.Root.Props) => {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={clsx(
        'bg-primary/20 relative h-2 w-full overflow-hidden rounded-full',
        props.className,
      )}
      {...props}
    >
      <ProgressPrimitive.Track className="h-full w-full">
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className="bg-primary h-full transition-all"
          style={{ width: `${props.value || 0}%` }}
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  );
};

export const VerticalProgress = (props: ProgressPrimitive.Root.Props) => {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={clsx(
        'relative w-2 h-full bg-primary/20 overflow-hidden rounded',
        props.className,
      )}
      {...props}
    >
      <ProgressPrimitive.Track className="h-full w-full">
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className="absolute bottom-0 left-0 w-full bg-primary transition-all"
          style={{ height: `${props.value}%` }}
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  );
};
