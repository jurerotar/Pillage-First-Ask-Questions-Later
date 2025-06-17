import clsx from 'clsx';
import type React from 'react';
import {
  type ITooltip as ReactTooltipProps,
  Tooltip as ReactTooltip,
} from 'react-tooltip';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';

export const Tooltip: React.FC<ReactTooltipProps> = (props) => {
  const { className, ...rest } = props;

  const isWiderThanLg = useMediaQuery('(min-width: 1024px)');

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
