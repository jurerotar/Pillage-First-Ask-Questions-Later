import clsx from 'clsx';
import {
  type ITooltip as ReactTooltipProps,
  Tooltip as ReactTooltip,
} from 'react-tooltip';

export const Tooltip = (props: ReactTooltipProps) => {
  const { className, ...rest } = props;

  return (
    <ReactTooltip
      className={clsx('!z-20 !rounded-lg !px-2 !py-1 !text-xs', className)}
      {...rest}
    />
  );
};
