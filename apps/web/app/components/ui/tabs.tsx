import { Tabs as TabsPrimitive } from '@base-ui/react';
import { clsx } from 'clsx';

export const Tabs = <Value extends string>({
  value,
  onValueChange,
  defaultValue,
  ...props
}: Omit<
  TabsPrimitive.Root.Props,
  'value' | 'onValueChange' | 'defaultValue'
> & {
  value?: Value;
  onValueChange?: (value: Value) => void;
  defaultValue?: Value;
}) => {
  return (
    <TabsPrimitive.Root
      {...props}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(val) => {
        onValueChange?.(val);
      }}
    />
  );
};

export const TabList = ({
  children,
  className,
  ...props
}: TabsPrimitive.List.Props) => {
  return (
    <TabsPrimitive.List
      className={clsx(
        'flex -mb-px overflow-x-scroll scrollbar-hidden',
        className,
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.List>
  );
};

export const Tab = ({
  children,
  className,
  ...props
}: TabsPrimitive.Tab.Props) => {
  return (
    <TabsPrimitive.Tab
      className={clsx(
        `
        flex whitespace-nowrap text-center justify-center p-2 px-4 cursor-pointer
        border-t border-b border-r border-border
        first:rounded-tl-xs last:rounded-tr-xs first:border-l border-l-0
        data-[active]:border-b-0 data-[active]:bg-input
        `,
        className,
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.Tab>
  );
};

export const TabPanel = ({
  children,
  className,
  ...props
}: TabsPrimitive.Panel.Props) => {
  return (
    <TabsPrimitive.Panel
      className={clsx(
        'border border-border p-2 rounded-bl-xs rounded-br-xs',
        className,
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.Panel>
  );
};
