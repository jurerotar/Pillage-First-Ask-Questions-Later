import { Separator as SeparatorPrimitive } from '@base-ui/react';
import { clsx } from 'clsx';
import type { ComponentProps } from 'react';

export const Separator = ({
  className,
  orientation = 'vertical',
  ...props
}: ComponentProps<typeof SeparatorPrimitive>) => {
  return (
    <SeparatorPrimitive
      data-slot="separator-root"
      orientation={orientation}
      className={clsx(
        'inline-flex bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:min-h-4 data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
        className,
      )}
      {...props}
    />
  );
};
