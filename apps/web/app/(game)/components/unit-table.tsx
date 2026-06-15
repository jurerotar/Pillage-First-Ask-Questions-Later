import { clsx } from 'clsx';
import {
  createContext,
  type PropsWithChildren,
  type ReactNode,
  use,
} from 'react';
import { useTranslation } from 'react-i18next';
import { calculateTotalUnitWheatConsumption } from '@pillage-first/game-assets/utils/troops';
import { getUnitsByTribeWithHero } from '@pillage-first/game-assets/utils/units';
import type { Tribe } from '@pillage-first/types/models/tribe';
import type { TroopLike } from '@pillage-first/types/models/troop';
import { formatNumber } from '@pillage-first/utils/format';
import { Icon } from 'app/components/icon';
import { unitIdToUnitIconMapper } from 'app/components/icons/icons';
import { Text } from 'app/components/text';

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

export const UnitTable = ({ tribe, children }: UnitTableProps) => {
  return (
    <UnitTableContext.Provider value={{ tribe }}>
      <div className="overflow-x-scroll scrollbar-hidden">
        <table className="w-full border-collapse border overflow-hidden dark:border-border text-left">
          {children}
        </table>
      </div>
    </UnitTableContext.Provider>
  );
};

export const UnitTableTitle = ({ children }: PropsWithChildren) => {
  return (
    <thead className="bg-muted border-b dark:border-border font-medium">
      <tr>
        <th
          colSpan={12}
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
  const tribeUnits = getUnitsByTribeWithHero(tribe);

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
  troops: TroopLike[];
};

export const UnitTableRow = ({ label, troops }: UnitTableRowProps) => {
  return (
    <tbody className="border-b last:border-b-0 dark:border-border">
      <tr>
        <td className="px-2 py-1 border-r dark:border-border">
          <Text className="text-sm font-medium">{label}</Text>
        </td>
        {troops.map(({ unitId, amount }, index) => (
          <td
            key={`amount-${unitId}`}
            className={clsx(
              'h-7  text-center',
              index !== troops.length - 1 && 'border-r dark:border-border',
            )}
          >
            <Text className="text-sm">{formatNumber(amount)}</Text>
          </td>
        ))}
      </tr>
    </tbody>
  );
};

type UnitTableWheatConsumptionProps = {
  troops: TroopLike[];
};

export const UnitTableWheatConsumption = ({
  troops,
}: UnitTableWheatConsumptionProps) => {
  const { t } = useTranslation();

  const totalWheatConsumption = calculateTotalUnitWheatConsumption(troops);

  return (
    <tfoot className="border-t dark:border-border">
      <tr>
        <td className="p-2">
          <Text className="text-sm font-medium">{t('Upkeep')}</Text>
        </td>
        <td
          colSpan={troops.length}
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
