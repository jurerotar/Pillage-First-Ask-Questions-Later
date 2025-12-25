import { clsx } from 'clsx';
import {
  Tooltip as ReactTooltip,
  type ITooltip as ReactTooltipProps,
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
