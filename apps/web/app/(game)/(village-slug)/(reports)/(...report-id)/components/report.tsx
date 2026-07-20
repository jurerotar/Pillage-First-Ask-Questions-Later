import { createContext, type PropsWithChildren, use, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { sortTroops } from '@pillage-first/game-assets/utils/troops';
import type { BattleParticipant } from '@pillage-first/types/models/battle';
import type {
  BattleReport,
  Report as ReportType,
} from '@pillage-first/types/models/report';
import { formatNumber } from '@pillage-first/utils/format';
import { getReportSubject } from 'app/(game)/(village-slug)/(reports)/utils/report-subject';
import {
  UnitTable,
  UnitTableHiddenRow,
  UnitTableLoot,
  UnitTablePlayer,
  UnitTableRow,
  UnitTableTitle,
  UnitTableUnitIcons,
} from 'app/(game)/components/unit-table';
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

type ReportContextState = {
  report: ReportType;
};

export const ReportContext = createContext<ReportContextState>(
  {} as ReportContextState,
);

type ReportProps = {
  report: ReportType;
};

export const Report = ({
  report,
  children,
}: PropsWithChildren<ReportProps>) => {
  const value = useMemo(
    () => ({
      report,
    }),
    [report],
  );

  return (
    <ReportContext value={value}>
      <article className="flex flex-col gap-2">{children}</article>
    </ReportContext>
  );
};

export const ReportHeader = () => {
  const { report } = use(ReportContext);

  return (
    <div className="flex flex-col gap-2">
      <Text as="h1">{getReportSubject(report)}</Text>
      <Text
        as="span"
        className="text-foreground-muted"
      >
        {new Date(report.timestamp).toLocaleString()}
      </Text>
    </div>
  );
};

type BattleParticipantTableProps = {
  participant: BattleParticipant;
  // It cannot be named "role" because it overlaps with native HTML attribute
  participantRole: 'attacker' | 'defender' | 'reinforcement';
};

export const BattleParticipantTable = ({
  participant,
  participantRole,
}: BattleParticipantTableProps) => {
  const { t } = useTranslation();
  const { report: _report } = use(ReportContext)!;

  const report = _report as BattleReport;
  const { battle } = report;
  const showDefendingUnits = battle.outcome.canAttackerSeeFullReport;
  const { troops, player, village } = participant;

  const { troopsBefore, troopsAfter, troopsLost } = useMemo(() => {
    const troopsBefore = sortTroops(
      troops.tribe,
      troops.units.map(({ unitId, amountBefore }) => ({
        unitId: unitId,
        amount: amountBefore,
      })),
    );

    const troopsAfter = sortTroops(
      troops.tribe,
      troops.units.map(({ unitId, amountAfter }) => ({
        unitId: unitId,
        amount: amountAfter,
      })),
    );

    const troopsLost = sortTroops(
      troops.tribe,
      troops.units.map(({ unitId, amountBefore, amountAfter }) => ({
        unitId: unitId,
        amount: amountBefore - amountAfter,
      })),
    );

    return {
      troopsBefore,
      troopsAfter,
      troopsLost,
    };
  }, [troops]);

  return (
    <UnitTable tribe={troops.tribe}>
      <UnitTableTitle>
        {participantRole === 'attacker' ? t('Attacker') : t('Defender')}
      </UnitTableTitle>
      <UnitTablePlayer
        playerName={player.name}
        playerSlug={player.slug}
        tileName={village.name}
        coordinates={village.coordinates}
      />
      <UnitTableUnitIcons />

      {participantRole !== 'attacker' && !showDefendingUnits ? (
        <UnitTableHiddenRow
          label={t('Troops')}
          troops={troopsBefore}
        />
      ) : (
        <>
          <UnitTableRow
            label={t('Initial')}
            troops={troopsBefore}
          />
          <UnitTableRow
            label={t('Casualties')}
            troops={troopsLost}
            textColor="text-red-500"
          />
          <UnitTableRow
            label={t('Remaining')}
            troops={troopsAfter}
            textColor="text-green-700"
          />
        </>
      )}

      <UnitTableLoot
        loot={battle.outcome.loot}
        totalCarryCapacity={battle.outcome.totalCarryCapacity}
      />
    </UnitTable>
  );
};

type StatisticsRowProps = {
  name: string;
  icons: [attacker: IconType, defender: IconType];
  values: [attacker: number, defender: number];
  showDefendingUnits: boolean;
};

const StatisticsRow = ({
  name,
  icons,
  values,
  showDefendingUnits,
}: StatisticsRowProps) => (
  <TableRow>
    <TableCell className="text-left">{name}</TableCell>
    <TableCell className="text-left">
      <span className="inline-flex gap-2 items-center text-left">
        <Icon
          type={icons[0]}
          className="size-5"
        />
        {formatNumber(Math.round(values[0]))}
      </span>
    </TableCell>
    <TableCell className="text-left">
      <span className="inline-flex gap-2 items-center">
        <Icon
          type={icons[1]}
          className="size-5"
        />
        {showDefendingUnits ? formatNumber(Math.round(values[1])) : '?'}
      </span>
    </TableCell>
  </TableRow>
);

export const BattleStatisticsTable = () => {
  const { t } = useTranslation();
  const { report: _report } = use(ReportContext)!;

  const report = _report as BattleReport;
  const { statistics, outcome } = report.battle;
  const { attacker, defender } = statistics;
  const showDefendingUnits = outcome.canAttackerSeeFullReport;

  const rows: Omit<StatisticsRowProps, 'showDefendingUnits'>[] = [
    {
      name: t('Combat strength'),
      icons: ['attack', 'defence'],
      values: [attacker.points, defender.points],
    },
    {
      name: t('Supply before'),
      icons: ['wheat', 'wheat'],
      values: [attacker.supplyBefore, defender.supplyBefore],
    },
    {
      name: t('Supply lost'),
      icons: ['freeCrop', 'freeCrop'],
      values: [attacker.supplyLost, defender.supplyLost],
    },
    {
      name: t('Resources lost'),
      icons: ['unitCarryCapacity', 'unitCarryCapacity'],
      values: [attacker.resourcesLost, defender.resourcesLost],
    },
  ];

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

          {rows.map((row) => (
            <StatisticsRow
              key={row.name}
              {...row}
              showDefendingUnits={showDefendingUnits}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
