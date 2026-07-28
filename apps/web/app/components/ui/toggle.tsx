import type { VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { Toggle as TogglePrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { toggleVariants } from 'app/components/ui/cvas/toggle-cva';

type ToggleProps = ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>;

export const Toggle = ({ className, variant, size, ...props }: ToggleProps) => {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={clsx(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
};
