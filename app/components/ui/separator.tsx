import { Separator as SeparatorPrimitive } from 'radix-ui';
import { clsx } from 'clsx';
import type { ComponentProps } from 'react';

export const Separator = ({
  className,
  orientation = 'vertical',
  decorative = true,
  ...props
}: ComponentProps<typeof SeparatorPrimitive.Root>) => {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator-root"
      decorative={decorative}
      orientation={orientation}
      className={clsx(
        'inline-flex bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:min-h-4 data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
        className,
      )}
      {...props}
    />
  );
};
