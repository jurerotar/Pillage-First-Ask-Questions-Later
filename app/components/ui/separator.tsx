import type React from 'react';
import { Separator as SeparatorPrimitive } from 'radix-ui';
import { cn } from 'app/utils/tailwind';

export const Separator: React.FC<React.ComponentProps<typeof SeparatorPrimitive.Root>> = ({
  className,
  orientation = 'vertical',
  decorative = true,
  ...props
}) => {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator-root"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'inline-flex bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
        className,
      )}
      {...props}
    />
  );
};
