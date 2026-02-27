import {
  ToggleGroup as ToggleGroupPrimitive,
  Toggle as TogglePrimitive,
} from '@base-ui/react';
import type { VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { createContext, use, useMemo } from 'react';
import { toggleVariants } from 'app/components/ui/toggle';

const ToggleGroupContext = createContext<VariantProps<typeof toggleVariants>>({
  size: 'default',
  variant: 'default',
});

export const ToggleGroup = <Value extends string>({
  className,
  variant,
  size,
  children,
  type = 'single',
  value,
  onValueChange,
  multiple,
  ...props
}: (Omit<
  ToggleGroupPrimitive.Props<Value>,
  'value' | 'onValueChange' | 'multiple'
> & {
  type?: 'single' | 'multiple';
  value?: Value | Value[];
  onValueChange?: (value: any) => void;
  multiple?: boolean;
}) &
  VariantProps<typeof toggleVariants>) => {
  const contextValue = useMemo(() => {
    return {
      variant,
      size,
    };
  }, [variant, size]);

  const isMultiple = multiple ?? type === 'multiple';

  const adjustedValue = useMemo(() => {
    if (!isMultiple && typeof value === 'string') {
      return [value] as Value[];
    }
    return value as Value[];
  }, [value, isMultiple]);

  const handleValueChange = (val: Value[]) => {
    if (!isMultiple) {
      onValueChange?.(val[0]);
    } else {
      onValueChange?.(val);
    }
  };

  return (
    <ToggleGroupPrimitive<Value>
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      className={clsx(
        'group/toggle-group flex w-fit gap-1 lg:gap-2 items-center',
        className,
      )}
      {...props}
      multiple={isMultiple}
      value={adjustedValue}
      onValueChange={handleValueChange}
    >
      <ToggleGroupContext value={contextValue}>{children}</ToggleGroupContext>
    </ToggleGroupPrimitive>
  );
};

export const ToggleGroupItem = <Value extends string>({
  className,
  children,
  variant,
  size,
  ...props
}: TogglePrimitive.Props & { value: Value } & VariantProps<
    typeof toggleVariants
  >) => {
  const context = use(ToggleGroupContext);

  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      data-size={context.size || size}
      className={clsx(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        'min-w-0 flex-1 shrink-0 rounded-sm shadow-none focus:z-10 focus-visible:z-10',
        className,
      )}
      {...props}
    >
      {children}
    </TogglePrimitive>
  );
};
