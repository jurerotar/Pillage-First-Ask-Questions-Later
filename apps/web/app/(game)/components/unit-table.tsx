import { clsx } from 'clsx';
import { createContext, type ReactNode, use } from 'react';
import {
  getUnitDefinition,
  getUnitsByTribe,
} from '@pillage-first/game-assets/utils/units';
import type { Tribe } from '@pillage-first/types/models/tribe';
import { Icon } from 'app/components/icon';
import { unitIdToUnitIconMapper } from 'app/components/icons/icons';
import { Input } from 'app/components/ui/input';

type UnitTableContextValue = {
  tribe: Tribe;
};

const UnitTableContext = createContext<UnitTableContextValue>(
  {} as UnitTableContextValue,
);

type UnitTableProps = {
  tribe: Tribe;
  children: ReactNode;
  className?: string;
};

const getTribeUnits = (tribe: Tribe) => [
  ...getUnitsByTribe(tribe),
  getUnitDefinition('HERO'),
];

export const UnitTable = ({ tribe, children, className }: UnitTableProps) => {
  return (
    <UnitTableContext.Provider value={{ tribe }}>
      <div
        className={clsx(
          'flex flex-col border overflow-hidden dark:border-border',
          className,
        )}
      >
        {children}
      </div>
    </UnitTableContext.Provider>
  );
};

export const UnitTableHeader = ({ className }: { className?: string }) => {
  const { tribe } = use(UnitTableContext);
  const tribeUnits = getTribeUnits(tribe);

  return (
    <div
      className={clsx('grid border-b dark:border-border', className)}
      style={{
        gridTemplateColumns: `repeat(${tribeUnits.length}, minmax(0, 1fr))`,
      }}
    >
      {tribeUnits.map((unitDef, index) => (
        <div
          key={`icon-${unitDef.id}`}
          className={clsx(
            'flex justify-center p-2 bg-muted/50',
            index !== tribeUnits.length - 1 && 'border-r dark:border-border',
          )}
        >
          <Icon
            type={unitIdToUnitIconMapper(unitDef.id)}
            className="size-5"
          />
        </div>
      ))}
    </div>
  );
};

export const UnitTableRow = ({
  amount,
  className,
}: {
  amount: (number | string)[];
  className?: string;
}) => {
  const { tribe } = use(UnitTableContext);
  const tribeUnits = getTribeUnits(tribe);

  return (
    <div
      className={clsx('grid', className)}
      style={{
        gridTemplateColumns: `repeat(${tribeUnits.length}, minmax(0, 1fr))`,
      }}
    >
      {tribeUnits.map((unitDef, index) => (
        <div
          key={`amount-${unitDef.id}`}
          className={clsx(
            'flex justify-center',
            index !== tribeUnits.length - 1 && 'border-r dark:border-border',
          )}
        >
          <Input
            value={amount[index] ?? 0}
            disabled
            hideSpinner
            className="px-1 text-center rounded-none w-full bg-emerald-50/50 dark:bg-emerald-950/20 disabled:opacity-100 h-7 border-none shadow-none"
          />
        </div>
      ))}
    </div>
  );
};
