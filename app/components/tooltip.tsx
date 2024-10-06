import clsx from 'clsx';
import type React from 'react';
import { Tooltip as ReactTooltip, type ITooltip as ReactTooltipProps } from 'react-tooltip';

export const Tooltip: React.FC<ReactTooltipProps> = (props) => {
  const { className, ...rest } = props;
  return (
    <ReactTooltip
      className={clsx('!z-10 !rounded-lg !px-2 !py-1 !text-xs', className)}
      {...rest}
    />
  );
};
