import { Toggle, ToggleGroup as ToggleGroupPrimitive } from '@base-ui/react';
import type { VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { type ComponentProps, createContext, use, useMemo } from 'react';
import { toggleVariants } from 'app/components/ui/cvas/toggle-cva';

const ToggleGroupContext = createContext<VariantProps<typeof toggleVariants>>({
  size: 'default',
  variant: 'default',
});

type ToggleGroupProps = Omit<
  ComponentProps<typeof ToggleGroupPrimitive>,
  'value' | 'defaultValue' | 'onValueChange'
> &
  (
    | {
        type: 'single';
        value?: string;
        defaultValue?: string;
        onValueChange?: (value: string) => void;
      }
    | {
        type: 'multiple';
        value?: string[];
        defaultValue?: string[];
        onValueChange?: (value: string[]) => void;
      }
  ) &
  VariantProps<typeof toggleVariants>;

export const ToggleGroup = ({
  className,
  variant,
  size,
  children,
  ...props
}: ToggleGroupProps) => {
  const { type, ...groupProps } = props;
  const value = useMemo(() => {
    return {
      variant,
      size,
    };
  }, [variant, size]);

  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      className={clsx(
        'group/toggle-group flex w-fit gap-1 lg:gap-2 items-center',
        className,
      )}
      {...groupProps}
      multiple={type === 'multiple'}
      value={
        props.value === undefined
          ? undefined
          : typeof props.value === 'string'
            ? [props.value]
            : props.value
      }
      defaultValue={
        props.defaultValue === undefined
          ? undefined
          : typeof props.defaultValue === 'string'
            ? [props.defaultValue]
            : props.defaultValue
      }
      onValueChange={(value) => {
        if (props.type === 'single') {
          props.onValueChange?.(value[0] ?? '');
        } else {
          props.onValueChange?.(value);
        }
      }}
    >
      <ToggleGroupContext value={value}>{children}</ToggleGroupContext>
    </ToggleGroupPrimitive>
  );
};

type ToggleGroupItemProps = ComponentProps<typeof Toggle> &
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
    <Toggle
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
    </Toggle>
  );
};
