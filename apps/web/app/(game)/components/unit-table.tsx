import { clsx } from 'clsx';
import {
  createContext,
  type PropsWithChildren,
  type ReactNode,
  use,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { calculateTotalUnitWheatConsumption } from '@pillage-first/game-assets/utils/troops';
import { getUnitsByTribeWithHero } from '@pillage-first/game-assets/utils/units';
import type { Coordinates } from '@pillage-first/types/models/coordinates';
import type { ResourceBundle } from '@pillage-first/types/models/resource';
import type { Tribe } from '@pillage-first/types/models/tribe';
import type { TroopLike } from '@pillage-first/types/models/troop';
import { formatNumber } from '@pillage-first/utils/format';
import { OverflowContainer } from 'app/(game)/(village-slug)/components/building-layout';
import { Icon } from 'app/components/icon';
import { unitIdToUnitIconMapper } from 'app/components/icons/icons';
import { Text } from 'app/components/text';
import { Resources } from '../(village-slug)/components/resources';

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
      <OverflowContainer>
        <table className="w-full border-collapse border overflow-hidden dark:border-border text-left">
          {children}
        </table>
      </OverflowContainer>
    </UnitTableContext.Provider>
  );
};

export const UnitTableTitle = ({ children }: PropsWithChildren) => {
  return (
    <thead className="bg-muted border-b dark:border-border font-medium">
      <tr>
        <th
          colSpan={12}
          className="p-2 text-left font-medium capitalize"
        >
          {children}
        </th>
      </tr>
    </thead>
  );
};

type UnitTablePlayerProps = {
  playerName: string;
  playerSlug: string;
  villageName: string;
  coordinates: Coordinates;
};

export const UnitTablePlayer = ({
  playerName,
  playerSlug,
  villageName,
  coordinates,
}: UnitTablePlayerProps) => {
  const { t } = useTranslation();

  return (
    <thead className="bg-muted border-b dark:border-border font-medium">
      <tr>
        <th
          colSpan={12}
          className="p-2 text-left font-medium"
        >
          <Link
            to={`../players/${playerSlug}`}
            className="text-link"
          >
            {playerName}
          </Link>
          {t(' from village ')}
          <Link
            to={`../map?x=${coordinates.x}&y=${coordinates.y}`}
            className="text-link"
          >
            {villageName}
          </Link>
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
  textColor?: string;
};

export const UnitTableRow = ({
  label,
  troops,
  textColor,
}: UnitTableRowProps) => {
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
            <Text className={clsx('text-sm', textColor)}>
              {formatNumber(amount)}
            </Text>
          </td>
        ))}
      </tr>
    </tbody>
  );
};

type UnitTableHiddenRowProps = {
  label: ReactNode;
  troops: TroopLike[];
};

export const UnitTableHiddenRow = ({
  label,
  troops,
}: UnitTableHiddenRowProps) => {
  return (
    <tbody className="border-b last:border-b-0 dark:border-border">
      <tr>
        <td className="px-2 py-1 border-r dark:border-border">
          <Text className="text-sm font-medium">{label}</Text>
        </td>
        {troops.map(({ unitId }, index) => (
          <td
            key={`amount-${unitId}`}
            className={clsx(
              'h-7  text-center',
              index !== troops.length - 1 && 'border-r dark:border-border',
            )}
          >
            <Text className="text-sm text-gray-700">?</Text>
          </td>
        ))}
      </tr>
    </tbody>
  );
};

type UnitTableLootProps = {
  loot: ResourceBundle;
  totalCarryCapacity: number;
};

export const UnitTableLoot = ({
  loot,
  totalCarryCapacity,
}: UnitTableLootProps) => {
  const { t } = useTranslation();

  let totalLoot = 0;
  for (const resource of loot) {
    totalLoot += resource;
  }

  return (
    <tfoot className="border-t dark:border-border py-3">
      <tr>
        <td className="p-2">
          <Text className="text-sm font-medium">{t('Loot')}:</Text>
        </td>
        <td
          colSpan={100}
          className="p-2"
        >
          <div className="flex justify-left items-center gap-2 text-sm">
            <Resources
              resources={loot}
              iconClassName="size-4"
            />
            (
            <span className="text-sm font-medium whitespace-nowrap">
              {totalLoot} / {totalCarryCapacity}
            </span>
            <Icon
              className="size-4"
              type="unitCarryCapacity"
            />
            )
          </div>
        </td>
      </tr>
    </tfoot>
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
