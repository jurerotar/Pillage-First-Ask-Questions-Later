import { Icon } from 'app/components/icon';
import { formatNumber } from 'app/utils/common';
import clsx from 'clsx';
import type React from 'react';
import type { HTMLAttributes } from 'react';

type ResourcesProps = {
  resources: number[];
} & HTMLAttributes<HTMLSpanElement>;

export const Resources: React.FC<ResourcesProps> = ({ resources, className, ...rest }) => {
  const [wood, clay, iron, wheat] = resources;

  return (
    <span
      className={clsx('flex gap-2', className)}
      {...rest}
    >
      <span className="flex gap-1 items-center">
        <Icon
          type="wood"
          className="size-5"
        />
        {formatNumber(wood)}
      </span>
      <span className="flex gap-1 items-center">
        <Icon
          type="clay"
          className="size-5"
        />
        {formatNumber(clay)}
      </span>
      <span className="flex gap-1 items-center">
        <Icon
          type="iron"
          className="size-5"
        />
        {formatNumber(iron)}
      </span>
      <span className="flex gap-1 items-center">
        <Icon
          type="wheat"
          className="size-5"
        />
        {formatNumber(wheat)}
      </span>
    </span>
  );
};
