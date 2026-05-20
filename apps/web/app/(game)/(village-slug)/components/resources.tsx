import type { HTMLAttributes } from 'react';
import { formatNumber } from '@pillage-first/utils/format';
import { Icon } from 'app/components/icon';

type ResourcesProps = {
  resources: number[];
  iconClassName?: string;
} & HTMLAttributes<HTMLSpanElement>;

export const Resources = ({
  resources,
  iconClassName = 'size-5',
}: ResourcesProps) => {
  const [wood, clay, iron, wheat] = resources;

  return (
    <>
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
    </>
  );
};
