import clsx from 'clsx';
import type React from 'react';
import { use } from 'react';
import { type ITooltip as ReactTooltipProps, Tooltip as ReactTooltip } from 'react-tooltip';
import { ViewportContext } from 'app/providers/viewport-context';

export const Tooltip: React.FC<ReactTooltipProps> = (props) => {
  const { className, ...rest } = props;

  const { isWiderThanLg } = use(ViewportContext);

  if (!isWiderThanLg) {
    return null;
  }

  return (
    <ReactTooltip
      className={clsx('!z-20 !rounded-lg !px-2 !py-1 !text-xs', className)}
      {...rest}
    />
  );
};
