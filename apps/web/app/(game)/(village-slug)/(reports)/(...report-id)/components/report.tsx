import { createContext, type PropsWithChildren, use, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { getItemDefinition } from '@pillage-first/game-assets/utils/items';
import { sortTroops } from '@pillage-first/game-assets/utils/troops';
import type { BattleParticipant } from '@pillage-first/types/models/battle';
import type {
  AdventureReport,
  BattleReport,
  GatheringExpeditionReport,
  HuntingPartyReport,
  Report as ReportType,
  ScoutingReport,
  TradeReport,
  TroopMovementReport,
} from '@pillage-first/types/models/report';
import { formatNumber } from '@pillage-first/utils/format';
import { getReportSubject } from 'app/(game)/(village-slug)/(reports)/utils/report-subject';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import {
  UnitTable,
  UnitTableHiddenRow,
  UnitTableLoot,
  UnitTablePlayer,
  UnitTableRow,
  UnitTableScoutedLoot,
  UnitTableTitle,
  UnitTableUnitIcons,
  UnitTableWheatConsumption,
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
  const { t } = useTranslation();
  const { report } = use(ReportContext);

  return (
    <div className="flex flex-col gap-2">
      <Text as="h1">{getReportSubject(report, t)}</Text>
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
  const { canAttackerSeeFullReport, loot, totalCarryCapacity } =
    report.battle.outcome;
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

      {participantRole !== 'attacker' && !canAttackerSeeFullReport ? (
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

      {participantRole === 'attacker' && (
        <UnitTableLoot
          loot={loot}
          totalCarryCapacity={totalCarryCapacity}
        />
      )}
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

export const MovementReportTable = () => {
  const { t } = useTranslation();
  const { report: _report } = use(ReportContext)!;
  const report = _report as TroopMovementReport;
  const { movement } = report;

  const troops = useMemo(
    () => sortTroops(movement.tribe, movement.units),
    [movement.tribe, movement.units],
  );

  const title =
    movement.movementType === 'reinforcement'
      ? t('Reinforcement')
      : t('Relocation');

  const {
    originPlayerName,
    originPlayerSlug,
    originName,
    originCoordinates,
    targetPlayerName,
    targetPlayerSlug,
    targetName,
    targetCoordinates,
  } = report.summary;

  return (
    <UnitTable tribe={movement.tribe}>
      <UnitTableTitle>{title}</UnitTableTitle>
      <thead className="bg-muted border-b dark:border-border font-medium">
        <tr>
          <th
            colSpan={12}
            className="p-2 text-left font-medium"
          >
            <Link
              to={`../players/${originPlayerSlug}`}
              className="text-link"
            >
              {originPlayerName}
            </Link>{' '}
            {t('from')}{' '}
            <Link
              to={`../map?x=${originCoordinates.x}&y=${originCoordinates.y}`}
              className="text-link"
            >
              {originName} ({originCoordinates.x}|{originCoordinates.y})
            </Link>{' '}
            {t('to')}{' '}
            {targetPlayerName && targetPlayerSlug && (
              <>
                <Link
                  to={`../players/${targetPlayerSlug}`}
                  className="text-link"
                >
                  {targetPlayerName}
                </Link>{' '}
              </>
            )}
            {t('from')}{' '}
            <Link
              to={`../map?x=${targetCoordinates.x}&y=${targetCoordinates.y}`}
              className="text-link"
            >
              {targetName} ({targetCoordinates.x}|{targetCoordinates.y})
            </Link>
          </th>
        </tr>
      </thead>
      <UnitTableUnitIcons />
      <UnitTableRow
        label={t('Troops')}
        troops={troops}
      />
      <UnitTableWheatConsumption troops={troops} />
    </UnitTable>
  );
};

export const TradeReportTable = () => {
  const { t } = useTranslation();
  const { report: _report } = use(ReportContext)!;
  const report = _report as TradeReport;
  const {
    originPlayerName,
    originPlayerSlug,
    originName,
    originCoordinates,
    targetPlayerName,
    targetPlayerSlug,
    targetName,
    targetCoordinates,
  } = report.summary;

  return (
    <div className="overflow-x-scroll scrollbar-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell
              colSpan={2}
              className="text-left"
            >
              <Text>{t('Trade')}</Text>
            </TableHeaderCell>
          </TableRow>
          <TableRow>
            <TableHeaderCell
              colSpan={2}
              className="text-left normal-case"
            >
              <Link
                to={`../players/${originPlayerSlug}`}
                className="text-link"
              >
                {originPlayerName}
              </Link>{' '}
              {t('from')}{' '}
              <Link
                to={`../map?x=${originCoordinates.x}&y=${originCoordinates.y}`}
                className="text-link"
              >
                {originName} ({originCoordinates.x}|{originCoordinates.y})
              </Link>{' '}
              {t('to')}{' '}
              <Link
                to={`../players/${targetPlayerSlug}`}
                className="text-link"
              >
                {targetPlayerName}
              </Link>{' '}
              {t('from')}{' '}
              <Link
                to={`../map?x=${targetCoordinates.x}&y=${targetCoordinates.y}`}
                className="text-link"
              >
                {targetName} ({targetCoordinates.x}|{targetCoordinates.y})
              </Link>
            </TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="text-left font-medium">
              {t('Resources')}
            </TableCell>
            <TableCell className="text-left">
              <div className="flex flex-wrap items-center gap-2">
                <Resources
                  resources={report.trade.resources}
                  iconClassName="size-4"
                />
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

export const ScoutingReportTables = () => {
  const { t } = useTranslation();
  const { report: rawReport } = use(ReportContext);

  const report = rawReport as ScoutingReport;
  const { scouting, summary } = report;

  const attackerTroopsBefore = sortTroops(
    scouting.attacker.tribe,
    scouting.attacker.units.map(({ unitId, amountBefore }) => ({
      unitId,
      amount: amountBefore,
    })),
  );

  const attackerTroopsAfter = sortTroops(
    scouting.attacker.tribe,
    scouting.attacker.units.map(({ unitId, amountAfter }) => ({
      unitId,
      amount: amountAfter,
    })),
  );

  const attackerTroopsLost = sortTroops(
    scouting.attacker.tribe,
    scouting.attacker.units.map(({ unitId, amountBefore, amountAfter }) => ({
      unitId,
      amount: amountBefore - amountAfter,
    })),
  );

  const defenderTroops = sortTroops(
    scouting.defender.tribe,
    scouting.defender.units,
  );

  const hideIntelligence = !scouting.successful;

  return (
    <>
      <UnitTable tribe={scouting.attacker.tribe}>
        <UnitTableTitle>{t('Attacker')}</UnitTableTitle>
        <UnitTablePlayer
          playerName={summary.originPlayerName}
          playerSlug={summary.originPlayerSlug}
          tileName={summary.originName}
          coordinates={summary.originCoordinates}
        />
        <UnitTableUnitIcons />
        <UnitTableRow
          label={t('Initial')}
          troops={attackerTroopsBefore}
        />
        <UnitTableRow
          label={t('Casualties')}
          troops={attackerTroopsLost}
          textColor="text-red-500"
        />
        <UnitTableRow
          label={t('Remaining')}
          troops={attackerTroopsAfter}
          textColor="text-green-700"
        />
      </UnitTable>
      <UnitTable tribe={scouting.defender.tribe}>
        <UnitTableTitle>{t('Defender')}</UnitTableTitle>
        <UnitTablePlayer
          playerName={summary.targetPlayerName}
          playerSlug={summary.targetPlayerSlug}
          tileName={summary.targetName}
          coordinates={summary.targetCoordinates}
        />
        <UnitTableUnitIcons />
        {hideIntelligence ? (
          <UnitTableHiddenRow
            label={t('Troops')}
            troops={defenderTroops}
          />
        ) : (
          <UnitTableRow
            label={t('Troops')}
            troops={defenderTroops}
          />
        )}
        {hideIntelligence && (
          <tfoot className="border-t dark:border-border">
            <tr>
              <td
                colSpan={12}
                className="p-2 text-left"
              >
                <Text className="text-sm font-medium">
                  {t('No information was gathered')}
                </Text>
              </td>
            </tr>
          </tfoot>
        )}
        {!hideIntelligence && scouting.resources && (
          <UnitTableScoutedLoot loot={scouting.resources} />
        )}
        {!hideIntelligence && scouting.defensiveStructures.length > 0 && (
          <tfoot className="border-t dark:border-border">
            {scouting.defensiveStructures.map(({ buildingId, level }) => (
              <tr key={buildingId}>
                <td className="p-2">
                  <Text className="text-sm font-medium">
                    {t(`BUILDINGS.${buildingId}.NAME`)}
                  </Text>
                </td>
                <td
                  colSpan={100}
                  className="p-2 text-left"
                >
                  <Text className="text-sm">
                    {t('Level {{level}}', { level })}
                  </Text>
                </td>
              </tr>
            ))}
          </tfoot>
        )}
      </UnitTable>
      {!hideIntelligence &&
        scouting.defender.reinforcements.map((reinforcement) => {
          const troops = sortTroops(reinforcement.tribe, reinforcement.units);
          return (
            <UnitTable
              key={`${reinforcement.village.coordinates.x}:${reinforcement.village.coordinates.y}`}
              tribe={reinforcement.tribe}
            >
              <UnitTableTitle>{t('Reinforcement')}</UnitTableTitle>
              <UnitTablePlayer
                playerName={reinforcement.player.name}
                playerSlug={reinforcement.player.slug}
                tileName={reinforcement.village.name}
                coordinates={reinforcement.village.coordinates}
              />
              <UnitTableUnitIcons />
              <UnitTableRow
                label={t('Troops')}
                troops={troops}
              />
            </UnitTable>
          );
        })}
    </>
  );
};

export const HuntingPartyReportTable = () => {
  const { t } = useTranslation();
  const { report: _report } = use(ReportContext)!;
  const report = _report as HuntingPartyReport;
  const troops = sortTroops(report.tribe, report.units);

  return (
    <UnitTable tribe={report.tribe}>
      <UnitTableTitle>{t('Hunting party')}</UnitTableTitle>
      <UnitTablePlayer
        playerName={t('Hunting party')}
        tileName={report.summary.villageName}
        coordinates={report.summary.villageCoordinates}
      />
      <UnitTableUnitIcons />
      <UnitTableRow
        label={t('Captured animals')}
        troops={troops}
      />
    </UnitTable>
  );
};

export const GatheringExpeditionReportTable = () => {
  const { t } = useTranslation();
  const { report: _report } = use(ReportContext)!;
  const report = _report as GatheringExpeditionReport;
  const troops = sortTroops(report.tribe, report.units);

  let totalLoot = 0;

  for (const amount of report.loot) {
    totalLoot += amount;
  }

  return (
    <UnitTable tribe={report.tribe}>
      <UnitTableTitle>{t('Gathering expedition')}</UnitTableTitle>
      <UnitTablePlayer
        playerName={t('Gathering expedition')}
        tileName={report.summary.villageName}
        coordinates={report.summary.villageCoordinates}
      />
      <UnitTableUnitIcons />
      <UnitTableRow
        label={t('Sent troops')}
        troops={troops}
      />
      <UnitTableLoot
        loot={report.loot}
        totalCarryCapacity={totalLoot}
      />
    </UnitTable>
  );
};

export const AdventureReportTable = () => {
  const { t } = useTranslation();
  const { report: _report } = use(ReportContext)!;
  const report = _report as AdventureReport;
  const { adventureId, healthBefore, healthAfter, itemId, itemAmount } = report;
  const healthDifference = healthAfter - healthBefore;
  const hasHeroDied = healthAfter === 0;
  const experienceGained = hasHeroDied ? 0 : adventureId * 10;

  const formattedHealthDifference = `${healthDifference > 0 ? '+' : ''}${healthDifference}%`;

  return (
    <div className="overflow-x-scroll scrollbar-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell
              colSpan={2}
              className="text-left"
            >
              <Text>{t('Adventure statistics')}</Text>
            </TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="text-left font-medium">
              {t('Health')}
            </TableCell>
            <TableCell className="text-left">
              {healthBefore}% → {healthAfter}% ({formattedHealthDifference})
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-left font-medium">
              {t('Experience')}
            </TableCell>
            <TableCell className="text-left">
              +{formatNumber(experienceGained)}
            </TableCell>
          </TableRow>
          {hasHeroDied ? (
            <TableRow>
              <TableCell
                colSpan={2}
                className="text-left text-red-500"
              >
                {t('Hero died.')}
              </TableCell>
            </TableRow>
          ) : (
            <TableRow>
              <TableCell className="text-left font-medium">
                {t('Item')}
              </TableCell>
              <TableCell className="text-left">
                {itemId === null
                  ? t('Hero found nothing.')
                  : `${formatNumber(itemAmount!)}x ${t(`ITEMS.${getItemDefinition(itemId).name}.NAME`)}`}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export const AdventureHeroTable = () => {
  const { t } = useTranslation();
  const { report: _report } = use(ReportContext)!;
  const report = _report as AdventureReport;
  const {
    originPlayerName,
    originPlayerSlug,
    originVillageName,
    originCoordinates,
    tribe,
  } = report.summary;
  const troops = sortTroops(tribe, [{ unitId: 'HERO', amount: 1 }]);

  return (
    <UnitTable tribe={tribe}>
      <UnitTableTitle>{t('Adventure')}</UnitTableTitle>
      <UnitTablePlayer
        playerName={originPlayerName}
        playerSlug={originPlayerSlug}
        tileName={originVillageName}
        coordinates={originCoordinates}
      />
      <UnitTableUnitIcons />
      <UnitTableRow
        label={t('Troops')}
        troops={troops}
      />
    </UnitTable>
  );
};
