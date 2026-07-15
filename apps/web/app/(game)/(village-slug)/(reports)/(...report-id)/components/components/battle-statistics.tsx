import { clsx } from 'clsx';
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
    <TableCell className="text-left">{name}</TableCell>
    <TableCell className="text-left">
      <span className="inline-flex gap-2 items-center text-left">
        <Icon
          type={attackerIcon}
          className="size-5"
        />
        {formatNumber(attackerValue)}
      </span>
    </TableCell>
    <TableCell className={clsx('text-left')}>
      <span className="inline-flex gap-2 items-center">
        <Icon
          type={defenderIcon}
          className="size-5"
        />
        {showDefendingUnits ? formatNumber(defenderValue) : '?'}
      </span>
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
}: BattleStatisticsProps) => {
  const { t } = useTranslation();

  return (
    <div className="overflow-x-scroll scrollbar-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell
              colSpan={3}
              className="text-left col-span-full"
            >
              <Text>{t('Statistics')}</Text>
            </TableHeaderCell>
          </TableRow>
        </TableHeader>

        <TableBody>
          <TableRow>
            <TableCell />
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
