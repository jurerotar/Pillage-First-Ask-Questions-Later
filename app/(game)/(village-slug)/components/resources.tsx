import { Icon } from 'app/components/icon';
import { formatNumber } from 'app/utils/common';
import { clsx } from 'clsx';
import type { HTMLAttributes } from 'react';

type ResourcesProps = {
  resources: number[];
  iconClassName?: string;
} & HTMLAttributes<HTMLSpanElement>;

export const Resources = ({
  resources,
  className,
  iconClassName = 'size-5',
  ...rest
}: ResourcesProps) => {
  const [wood, clay, iron, wheat] = resources;

  return (
    <span
      className={clsx('flex gap-2', className)}
      {...rest}
    >
      <span className="flex gap-1 items-center">
        <Icon
          type="wood"
          className={iconClassName}
        />
        {formatNumber(wood)}
      </span>
      <span className="flex gap-1 items-center">
        <Icon
          type="clay"
          className={iconClassName}
        />
        {formatNumber(clay)}
      </span>
      <span className="flex gap-1 items-center">
        <Icon
          type="iron"
          className={iconClassName}
        />
        {formatNumber(iron)}
      </span>
      <span className="flex gap-1 items-center">
        <Icon
          type="wheat"
          className={iconClassName}
        />
        {formatNumber(wheat)}
      </span>
    </span>
  );
};
