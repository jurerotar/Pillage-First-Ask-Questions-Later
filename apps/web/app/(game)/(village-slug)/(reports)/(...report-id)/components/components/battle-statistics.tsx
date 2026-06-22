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

const statisticsRow = (
  name: string,
  attackerIcon: IconType,
  defenderIcon: IconType,
  attackerValue: number,
  defenderValue: number,
) => (
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
    <TableCell className="text-center">
      <div className="flex">
        <Icon
          type={defenderIcon}
          className="size-6 lg:size-6 m-2 "
        />
        <div className="my-auto">{formatNumber(defenderValue)}</div>
      </div>
    </TableCell>
  </TableRow>
);

type BattleStatisticsProps = {
  battle: BattleType;
};

export const BattleStatistics = ({
  battle,
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

        <TableBody>
          <TableRow>
            <TableCell className="text-center" />
            <TableCell className="text-left">{t('Attacker')}</TableCell>
            <TableCell className="text-left">{t('Defender')}</TableCell>
          </TableRow>

          {statisticsRow(
            t('Combat strength'),
            'attack',
            'defence',
            Math.round(battle.attackStatistics.points),
            Math.round(battle.defenceStatistics.points),
          )}

          {statisticsRow(
            t('Supply before'),
            'wheat',
            'wheat',
            Math.round(battle.attackStatistics.supplyBefore),
            Math.round(battle.defenceStatistics.supplyBefore),
          )}

          {statisticsRow(
            t('Supply lost'),
            'freeCrop',
            'freeCrop',
            Math.round(battle.attackStatistics.supplyLost),
            Math.round(battle.defenceStatistics.supplyLost),
          )}

          {statisticsRow(
            t('Resources lost'),
            'unitCarryCapacity',
            'unitCarryCapacity',
            Math.round(battle.attackStatistics.resourcesLost),
            Math.round(battle.defenceStatistics.resourcesLost),
          )}
        </TableBody>
      </Table>
    </div>
  );
};
