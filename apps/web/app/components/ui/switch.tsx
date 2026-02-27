import { Switch as SwitchPrimitive } from '@base-ui/react';
import { clsx } from 'clsx';

export const Switch = ({
  className,
  checked,
  onCheckedChange,
  ...props
}: SwitchPrimitive.Root.Props) => {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      checked={checked}
      className={clsx(
        'peer data-[checked]:bg-green-500 bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={clsx(
          'bg-background dark:bg-foreground data-[checked]:dark:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[checked]:translate-x-[calc(100%-2px)] translate-x-0',
        )}
      />
    </SwitchPrimitive.Root>
  );
};
