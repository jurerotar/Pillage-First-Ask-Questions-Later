import { Switch as SwitchPrimitive } from '@base-ui/react';
import { clsx } from 'clsx';
import type { ComponentProps } from 'react';

export const Switch = ({
  className,
  ...props
}: ComponentProps<typeof SwitchPrimitive.Root>) => {
  return (
    <SwitchPrimitive.Root
      render={<button type="button" />}
      nativeButton
      data-slot="switch"
      className={clsx(
        'peer data-checked:bg-green-500 data-unchecked:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-unchecked:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-[background-color,border-color] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={clsx(
          'bg-background dark:data-unchecked:bg-foreground dark:data-checked:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-[background-color,translate] data-checked:translate-x-[calc(100%-2px)] data-unchecked:translate-x-0',
        )}
      />
    </SwitchPrimitive.Root>
  );
};
