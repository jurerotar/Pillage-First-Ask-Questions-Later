import { Popover as PopoverPrimitive } from '@base-ui/react';
import { clsx } from 'clsx';
import { type ComponentProps, isValidElement } from 'react';

export const Popover = ({
  ...props
}: ComponentProps<typeof PopoverPrimitive.Root>) => {
  return (
    <PopoverPrimitive.Root
      data-slot="popover"
      {...props}
    />
  );
};

export const PopoverTrigger = ({
  asChild,
  children,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Trigger> & { asChild?: boolean }) => {
  return (
    <PopoverPrimitive.Trigger
      data-slot="popover-trigger"
      render={asChild && isValidElement(children) ? children : undefined}
      {...props}
    >
      {asChild ? undefined : children}
    </PopoverPrimitive.Trigger>
  );
};

export const PopoverContent = ({
  className,
  align = 'center',
  sideOffset = 4,
  side,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Popup> &
  Pick<
    ComponentProps<typeof PopoverPrimitive.Positioner>,
    'align' | 'side' | 'sideOffset'
  >) => {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        side={side}
        collisionPadding={0}
        sideOffset={sideOffset}
        className="z-50"
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={clsx(
            'bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 origin-(--transform-origin) rounded-md border p-1 shadow-md outline-hidden',
            className,
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
};

export const PopoverClose = ({
  asChild,
  children,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Close> & { asChild?: boolean }) => {
  return (
    <PopoverPrimitive.Close
      data-slot="popover-close"
      render={asChild && isValidElement(children) ? children : undefined}
      {...props}
    >
      {asChild ? undefined : children}
    </PopoverPrimitive.Close>
  );
};

export const PopoverArrow = ({
  className,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Arrow>) => {
  return (
    <PopoverPrimitive.Arrow
      data-slot="popover-arrow"
      className={clsx('fill-popover stroke-border', className)}
      {...props}
    />
  );
};
