import { clsx } from 'clsx';
import type { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import type { BattleType } from '@pillage-first/types/models/battle';
import { formatNumber } from '@pillage-first/utils/format';
import { Icon } from 'app/components/icon';
import type { IconType } from 'app/components/icons/icons';
import { Text } from 'app/components/text';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';

type StatisticsRowProps = {
  name: string;
  attackerIcon: IconType;
  defenderIcon: IconType;
  attackerValue: number;
  defenderValue: number;
  showDefendingUnits: boolean;
};

const StatisticsRow = ({
  name,
  attackerIcon,
  defenderIcon,
  attackerValue,
  defenderValue,
  showDefendingUnits,
}: StatisticsRowProps) => (
  <TableRow>
    <TableCell className="text-center">{name}</TableCell>
    <TableCell className="text-center">
      <div className="flex">
        <Icon
          type={attackerIcon}
          className="size-6 lg:size-6 m-2 "
        />
        <div className="my-auto">{formatNumber(attackerValue)}</div>
      </div>
    </TableCell>
    <TableCell
      className={clsx('text-center', showDefendingUnits ? '' : 'text-gray-700')}
    >
      <div className="flex">
        <Icon
          type={defenderIcon}
          className="size-6 lg:size-6 m-2 "
        />
        <div className="my-auto">
          {showDefendingUnits ? formatNumber(defenderValue) : '?'}
        </div>
      </div>
    </TableCell>
  </TableRow>
);

type BattleStatisticsProps = {
  battle: BattleType;
  showDefendingUnits: boolean;
};

export const BattleStatistics = ({
  battle,
  showDefendingUnits,
}: PropsWithChildren<BattleStatisticsProps>) => {
  const { t } = useTranslation();

  return (
    <div className="overflow-x-scroll scrollbar-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell className="text-left col-span-full">
              <Text>{t('Statistics')}</Text>
            </TableHeaderCell>
          </TableRow>
        </TableHeader>

        <TableBody className="text-sm">
          <TableRow>
            <TableCell className="text-center" />
            <TableCell className="text-left">{t('Attacker')}</TableCell>
            <TableCell className="text-left">{t('Defender')}</TableCell>
          </TableRow>

          <StatisticsRow
            name={t('Combat strength')}
            attackerIcon="attack"
            defenderIcon="defence"
            attackerValue={Math.round(battle.attackStatistics.points)}
            defenderValue={Math.round(battle.defenceStatistics.points)}
            showDefendingUnits={showDefendingUnits}
          />

          <StatisticsRow
            name={t('Supply before')}
            attackerIcon="wheat"
            defenderIcon="wheat"
            attackerValue={Math.round(battle.attackStatistics.supplyBefore)}
            defenderValue={Math.round(battle.defenceStatistics.supplyBefore)}
            showDefendingUnits={showDefendingUnits}
          />

          <StatisticsRow
            name={t('Supply lost')}
            attackerIcon="freeCrop"
            defenderIcon="freeCrop"
            attackerValue={Math.round(battle.attackStatistics.supplyLost)}
            defenderValue={Math.round(battle.defenceStatistics.supplyLost)}
            showDefendingUnits={showDefendingUnits}
          />

          <StatisticsRow
            name={t('Resources lost')}
            attackerIcon="unitCarryCapacity"
            defenderIcon="unitCarryCapacity"
            attackerValue={Math.round(battle.attackStatistics.resourcesLost)}
            defenderValue={Math.round(battle.defenceStatistics.resourcesLost)}
            showDefendingUnits={showDefendingUnits}
          />
        </TableBody>
      </Table>
    </div>
  );
};
