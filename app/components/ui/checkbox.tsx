import type React from 'react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import { LuCheck } from 'react-icons/lu';
import clsx from 'clsx';

export const Checkbox: React.FC<
  React.ComponentProps<typeof CheckboxPrimitive.Root>
> = ({ className, ...props }) => {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={clsx(
        'peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <LuCheck className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
};
