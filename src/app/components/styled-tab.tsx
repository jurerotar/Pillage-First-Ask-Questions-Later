import clsx from 'clsx';
import { type ReactTabsFunctionComponent, Tab, type TabProps } from 'react-tabs';

type StyledTabProps = TabProps & {
  variant?: 'default';
};

const styleMap = new Map<StyledTabProps['variant'], string>([
  ['default', 'flex flex-1 whitespace-nowrap text-center justify-center p-2 md:py-4 cursor-pointer border border-gray-500'],
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
