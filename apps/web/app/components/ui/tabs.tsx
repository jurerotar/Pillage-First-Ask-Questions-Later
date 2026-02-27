import { Tabs as TabsPrimitive } from '@base-ui/react';
import { clsx } from 'clsx';
import type { ComponentProps } from 'react';

type TabsProps = ComponentProps<typeof TabsPrimitive.Root>;

export const Tabs = ({
  children,
  value,
  onValueChange,
  defaultValue,
  ...props
}: TabsProps) => {
  return (
    <TabsPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      defaultValue={defaultValue}
      {...props}
    >
      {children}
    </TabsPrimitive.Root>
  );
};

export const TabList = ({
  children,
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.List>) => {
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
}: ComponentProps<typeof TabsPrimitive.Tab>) => {
  return (
    <TabsPrimitive.Tab
      className={clsx(
        `
        flex whitespace-nowrap text-center justify-center p-2 px-4 cursor-pointer
        border-t border-b border-r border-border
        first:rounded-tl-xs last:rounded-tr-xs first:border-l border-l-0
        data-[state=active]:border-b-0 data-[state=active]:bg-input
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
  value,
  ...props
}: ComponentProps<typeof TabsPrimitive.Panel>) => {
  return (
    <TabsPrimitive.Panel
      value={value}
      className={clsx(
        'p-4 bg-input border border-border border-t-0 rounded-b-xs',
        className,
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.Panel>
  );
};
