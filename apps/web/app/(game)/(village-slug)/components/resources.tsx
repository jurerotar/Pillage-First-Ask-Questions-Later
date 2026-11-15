import { clsx } from 'clsx';
import type { HTMLAttributes } from 'react';
import type { Resources as ResourceTotals } from '@pillage-first/types/models/resource';
import { formatNumber } from '@pillage-first/utils/format';
import { Icon } from 'app/components/icon';

type ResourcesProps = {
  resources: number[];
  availableResources?: ResourceTotals;
  iconClassName?: string;
} & HTMLAttributes<HTMLSpanElement>;

export const Resources = ({
  resources,
  availableResources,
  iconClassName = 'size-5',
}: ResourcesProps) => {
  const [wood, clay, iron, wheat] = resources;
  const availableResourceAmounts = availableResources
    ? [
        availableResources.wood,
        availableResources.clay,
        availableResources.iron,
        availableResources.wheat,
      ]
    : null;

  const resourceEntries = [
    { type: 'wood', amount: wood },
    { type: 'clay', amount: clay },
    { type: 'iron', amount: iron },
    { type: 'wheat', amount: wheat },
  ] as const;

  return (
    <>
      {resourceEntries.map(({ type, amount }, index) => {
        const isMissing =
          availableResourceAmounts !== null &&
          amount > availableResourceAmounts[index];

        return (
          <span
            key={type}
            className={clsx(
              'flex gap-1 items-center',
              isMissing && 'text-destructive',
            )}
          >
            <Icon
              type={type}
              className={iconClassName}
            />
            {formatNumber(amount)}
          </span>
        );
      })}
    </>
  );
};
