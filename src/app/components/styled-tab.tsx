import clsx from 'clsx';
import React from 'react';
import { type ReactTabsFunctionComponent, Tab, type TabProps } from 'react-tabs';

type StyledTabProps = TabProps & {
  variant?: 'default';
};

const styleMap = new Map<StyledTabProps['variant'], string>([
  ['default', 'flex flex-1 text-center justify-center py-4 px-2 cursor-pointer'],
]);

export const StyledTab: ReactTabsFunctionComponent<StyledTabProps> = ({ variant = 'default', children, ...rest }) => {
  const variantStyles = styleMap.get(variant);

  return (
    <Tab
      className={clsx(variantStyles)}
      {...rest}
    >
      {children}
    </Tab>
  );
};

StyledTab.tabsRole = 'Tab';
