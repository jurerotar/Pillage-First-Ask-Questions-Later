import { Icon } from 'app/components/icon';
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
      <span className="flex gap-1">
        <Icon type="wood" />
        {wood}
      </span>
      <span className="flex gap-1">
        <Icon type="clay" />
        {clay}
      </span>
      <span className="flex gap-1">
        <Icon type="iron" />
        {iron}
      </span>
      <span className="flex gap-1">
        <Icon type="wheat" />
        {wheat}
      </span>
    </span>
  );
};
