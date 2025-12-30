import {
  ToggleGroup as ToggleGroupPrimitive,
  Toggle as TogglePrimitive,
} from '@base-ui/react';
import type { VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { type ComponentProps, createContext, use } from 'react';
import { toggleVariants } from 'app/components/ui/toggle';

const ToggleGroupContext = createContext<VariantProps<typeof toggleVariants>>({
  size: 'default',
  variant: 'default',
});

type ToggleGroupProps = ComponentProps<typeof ToggleGroupPrimitive> &
  VariantProps<typeof toggleVariants>;

export const ToggleGroup = ({
  className,
  variant,
  size,
  children,
  ...props
}: ToggleGroupProps) => {
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      className={clsx(
        'group/toggle-group flex w-fit gap-1 lg:gap-2 items-center',
        className,
      )}
      {...props}
    >
      <ToggleGroupContext value={{ variant, size }}>
        {children}
      </ToggleGroupContext>
    </ToggleGroupPrimitive>
  );
};

type ToggleGroupItemProps = ComponentProps<typeof TogglePrimitive> &
  VariantProps<typeof toggleVariants>;

export const ToggleGroupItem = ({
  className,
  children,
  variant,
  size,
  ...props
}: ToggleGroupItemProps) => {
  const context = use(ToggleGroupContext);

  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      className={clsx(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        'bg-muted text-muted-foreground hover:bg-accent data-[state=on]:bg-gray-200 data-[state=on]:text-black min-w-0 flex-1 shrink-0 rounded-sm shadow-none focus:z-10 focus-visible:z-10',
        className,
      )}
      {...props}
    >
      {children}
    </TogglePrimitive>
  );
};
