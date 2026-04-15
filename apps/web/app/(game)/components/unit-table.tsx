import { clsx } from 'clsx';
import { createContext, type ReactNode, use } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getUnitDefinition,
  getUnitsByTribe,
} from '@pillage-first/game-assets/utils/units';
import type { Tribe } from '@pillage-first/types/models/tribe';
import { formatNumber } from '@pillage-first/utils/format';
import { Icon } from 'app/components/icon';
import { unitIdToUnitIconMapper } from 'app/components/icons/icons';
import { Text } from 'app/components/text.tsx';

type UnitTableContextValue = {
  tribe: Tribe;
};

const UnitTableContext = createContext<UnitTableContextValue>(
  {} as UnitTableContextValue,
);

type UnitTableProps = {
  tribe: Tribe;
  children: ReactNode;
};

const getTribeUnits = (tribe: Tribe) => [
  ...getUnitsByTribe(tribe),
  getUnitDefinition('HERO'),
];

export const UnitTable = ({ tribe, children }: UnitTableProps) => {
  return (
    <UnitTableContext.Provider value={{ tribe }}>
      <table className="w-full border-collapse border overflow-hidden dark:border-border text-left">
        {children}
      </table>
    </UnitTableContext.Provider>
  );
};

type UnitTableTitleProps = {
  children: ReactNode;
};

export const UnitTableTitle = ({ children }: UnitTableTitleProps) => {
  const { tribe } = use(UnitTableContext);
  const tribeUnits = getTribeUnits(tribe);

  return (
    <thead className="bg-muted border-b dark:border-border font-medium">
      <tr>
        <th
          colSpan={tribeUnits.length + 1}
          className="p-2 text-left font-medium"
        >
          {children}
        </th>
      </tr>
    </thead>
  );
};

export const UnitTableUnitIcons = () => {
  const { tribe } = use(UnitTableContext);
  const tribeUnits = getTribeUnits(tribe);

  return (
    <thead className="border-b dark:border-border">
      <tr>
        <th className="border-r dark:border-border w-16" />
        {tribeUnits.map((unitDef, index) => (
          <th
            key={`icon-${unitDef.id}`}
            className={clsx(
              'p-2 text-center',
              index !== tribeUnits.length - 1 && 'border-r dark:border-border',
            )}
          >
            <div className="flex justify-center">
              <Icon
                type={unitIdToUnitIconMapper(unitDef.id)}
                className="size-5"
              />
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
};

type UnitTableRowProps = {
  label: ReactNode;
  amount: number[];
};

export const UnitTableRow = ({ label, amount }: UnitTableRowProps) => {
  const { tribe } = use(UnitTableContext);
  const tribeUnits = getTribeUnits(tribe);

  return (
    <tbody className="border-b last:border-b-0 dark:border-border">
      <tr>
        <td className="px-2 py-1 border-r dark:border-border">
          <Text className="text-sm font-medium">{label}</Text>
        </td>
        {tribeUnits.map((unitDef, index) => (
          <td
            key={`amount-${unitDef.id}`}
            className={clsx(
              'h-7  text-center',
              index !== tribeUnits.length - 1 && 'border-r dark:border-border',
            )}
          >
            <Text className="text-sm">{formatNumber(amount[index])}</Text>
          </td>
        ))}
      </tr>
    </tbody>
  );
};

type UnitTableWheatConsumptionProps = {
  amount: number[];
};

export const UnitTableWheatConsumption = ({
  amount,
}: UnitTableWheatConsumptionProps) => {
  const { t } = useTranslation();
  const { tribe } = use(UnitTableContext);
  const tribeUnits = getTribeUnits(tribe);

  const totalWheatConsumption = tribeUnits.reduce((acc, unitDef, index) => {
    const unitAmount = Number(amount[index] ?? 0);
    return acc + unitAmount * unitDef.unitWheatConsumption;
  }, 0);

  return (
    <tfoot className="border-t dark:border-border">
      <tr>
        <td className="p-2">
          <Text className="text-sm font-medium">{t('Upkeep')}</Text>
        </td>
        <td
          colSpan={tribeUnits.length}
          className="p-2"
        >
          <div className="flex justify-end items-center gap-2">
            <span className="text-sm font-medium">{totalWheatConsumption}</span>
            <Icon
              className="size-4"
              type="unitWheatConsumption"
            />
          </div>
        </td>
      </tr>
    </tfoot>
  );
};
