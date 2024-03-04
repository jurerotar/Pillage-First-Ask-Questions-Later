import React from 'react';
import { ReactTabsFunctionComponent, Tab, TabProps } from 'react-tabs';
import clsx from 'clsx';

type StyledTabProps = TabProps & {
  variant?: 'default';
};

const styleMap = new Map<StyledTabProps['variant'], string>([
  ['default', '']
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
}

StyledTab.tabsRole = 'Tab'
