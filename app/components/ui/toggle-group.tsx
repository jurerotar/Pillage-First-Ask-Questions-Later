import type React from 'react';
import { createContext, use } from 'react';
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui';
import type { VariantProps } from 'class-variance-authority';
import clsx from 'clsx';
import { toggleVariants } from 'app/components/ui/toggle';

const ToggleGroupContext = createContext<VariantProps<typeof toggleVariants>>({
  size: 'default',
  variant: 'default',
});

export const ToggleGroup: React.FC<React.ComponentProps<typeof ToggleGroupPrimitive.Root> & VariantProps<typeof toggleVariants>> = ({
  className,
  variant,
  size,
  children,
  ...props
}) => {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      className={clsx('group/toggle-group flex w-fit gap-1 lg:gap-2 items-center', className)}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size }}>{children}</ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  );
};

export const ToggleGroupItem: React.FC<React.ComponentProps<typeof ToggleGroupPrimitive.Item> & VariantProps<typeof toggleVariants>> = ({
  className,
  children,
  variant,
  size,
  ...props
}) => {
  const context = use(ToggleGroupContext);

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      data-size={context.size || size}
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
    </ToggleGroupPrimitive.Item>
  );
};
