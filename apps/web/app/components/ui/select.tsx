import { Select as SelectPrimitive } from '@base-ui/react';
import { clsx } from 'clsx';
import {
  Children,
  type ComponentProps,
  isValidElement,
  type ReactNode,
} from 'react';
import { LuCheck, LuChevronDown, LuChevronUp } from 'react-icons/lu';

export const Select = <T extends string = string>({
  onValueChange,
  children,
  items,
  ...props
}: Omit<
  ComponentProps<typeof SelectPrimitive.Root<T>>,
  'onValueChange' | 'multiple'
> & { onValueChange?: (value: T) => void }) => {
  return (
    <SelectPrimitive.Root
      items={items ?? collectItems(children)}
      onValueChange={(value) => {
        if (value !== null) {
          onValueChange?.(value);
        }
      }}
      data-slot="select"
      {...props}
    >
      {children}
    </SelectPrimitive.Root>
  );
};

export const SelectGroup = ({
  ...props
}: ComponentProps<typeof SelectPrimitive.Group>) => {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      {...props}
    />
  );
};

export const SelectValue = ({
  ...props
}: ComponentProps<typeof SelectPrimitive.Value>) => {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      {...props}
    />
  );
};

type SelectTriggerProps = ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: 'sm' | 'default';
};

export const SelectTrigger = ({
  className,
  size = 'default',
  children,
  ...props
}: SelectTriggerProps) => {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={clsx(
        "border-input text-foreground data-placeholder:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit min-w-0 items-center justify-between gap-2 overflow-hidden rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,background-color,border-color] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:overflow-hidden *:data-[slot=select-value]:text-ellipsis *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:transition-[color,fill,stroke] [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <LuChevronDown className="size-4 opacity-50" />
    </SelectPrimitive.Trigger>
  );
};

export const SelectScrollUpButton = ({
  className,
  ...props
}: ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) => {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={clsx(
        'flex cursor-default items-center justify-center py-1 text-popover-foreground transition-colors',
        className,
      )}
      {...props}
    >
      <LuChevronUp className="size-4" />
    </SelectPrimitive.ScrollUpArrow>
  );
};

export const SelectScrollDownButton = ({
  className,
  ...props
}: ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) => {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={clsx(
        'flex cursor-default items-center justify-center py-1 text-popover-foreground transition-colors',
        className,
      )}
      {...props}
    >
      <LuChevronDown className="size-4" />
    </SelectPrimitive.ScrollDownArrow>
  );
};

export const SelectContent = ({
  className,
  children,
  position = 'popper',
  ...props
}: ComponentProps<typeof SelectPrimitive.Popup> & {
  position?: 'popper' | 'item-aligned';
}) => {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        align="start"
        alignItemWithTrigger={position === 'item-aligned'}
        className="z-50"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          className={clsx(
            'bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--available-height) min-w-[8rem] origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md transition-[color,background-color,border-color]',
            position === 'popper' &&
              'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
            className,
          )}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List
            className={clsx(
              'p-1',
              position === 'popper' &&
                'w-full min-w-(--anchor-width) scroll-my-1',
            )}
          >
            {children}
          </SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
};

export const SelectLabel = ({
  className,
  ...props
}: ComponentProps<typeof SelectPrimitive.GroupLabel>) => {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={clsx(
        'flex items-center py-1.5 gap-2 text-sm leading-none font-medium text-popover-foreground non-selectable transition-colors group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
};

export const SelectItem = ({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Item>) => {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={clsx(
        "text-popover-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden non-selectable transition-colors data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:transition-[color,fill,stroke] [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className,
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <LuCheck className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>
        <span className="inline-flex items-center gap-2">{children}</span>
      </SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
};

export const SelectSeparator = ({
  className,
  ...props
}: ComponentProps<typeof SelectPrimitive.Separator>) => {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={clsx(
        'bg-border pointer-events-none -mx-1 my-1 h-px transition-colors',
        className,
      )}
      {...props}
    />
  );
};

function collectItems(
  children: ReactNode,
): { value: string; label: ReactNode }[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ value?: string; children?: ReactNode }>(child)) {
      return [];
    }
    if (child.type === SelectItem && child.props.value !== undefined) {
      return [{ value: child.props.value, label: child.props.children }];
    }
    return collectItems(child.props.children);
  });
}
