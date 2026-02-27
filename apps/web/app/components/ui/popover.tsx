import { Popover as PopoverPrimitive } from '@base-ui/react';
import { clsx } from 'clsx';

export const Popover = (props: PopoverPrimitive.Root.Props) => {
  return <PopoverPrimitive.Root {...props} />;
};

export const PopoverTrigger = (props: PopoverPrimitive.Trigger.Props) => {
  return (
    <PopoverPrimitive.Trigger
      data-slot="popover-trigger"
      {...props}
    />
  );
};

export const PopoverContent = ({
  className,
  align = 'center',
  sideOffset = 4,
  ...props
}: PopoverPrimitive.Popup.Props & { align?: any; sideOffset?: number }) => {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        sideOffset={sideOffset}
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={clsx(
            'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 rounded-md border p-4 shadow-md outline-hidden',
            className,
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
};
