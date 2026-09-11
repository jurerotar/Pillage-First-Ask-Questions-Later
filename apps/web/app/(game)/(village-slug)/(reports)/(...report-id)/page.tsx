import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import {
  isAdventureReport,
  isBattleReport,
  isGatheringExpeditionReport,
  isHuntingPartyReport,
  isMovementReport,
  isScoutingReport,
  isTradeReport,
} from '@pillage-first/utils/guards/report';
import type { Route } from '@react-router/types/app/(game)/(village-slug)/(reports)/(...report-id)/+types/page';
import { useReports } from 'app/(game)/(village-slug)/hooks/use-reports';
import { PageContents } from 'app/components/page-contents';
import { Text } from 'app/components/text';
import { useReport } from '../../hooks/use-report';
import { ReportsListActions } from '../components/reports-list-actions';
import { useAdjacentReports } from '../hooks/use-adjacent-reports';
import {
  AdventureHeroTable,
  AdventureReportTable,
  BattleParticipantTable,
  BattleStatisticsTable,
  GatheringExpeditionReportTable,
  HuntingPartyReportTable,
  MovementReportTable,
  Report,
  ReportHeader,
  ReportNavigationButtons,
  ReportsBackButton,
  ScoutingReportTables,
  TradeReportTable,
} from './components/report';

const ReportPage = ({ params }: Route.ComponentProps) => {
  const { reportId: reportIdParam, villageSlug, serverSlug } = params;
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const reportId = Number.parseInt(reportIdParam, 10);
  const { report } = useReport(reportId);
  const { updateReports, deleteReports } = useReports();
  const { previousReportId, nextReportId } = useAdjacentReports(
    reportId,
    searchParams,
  );

  useEffect(() => {
    if (report && !report.tags.includes('read')) {
      updateReports({ reportIds: [report.id], tags: { read: true } });
    }
  }, [report, updateReports]);

  const title = `${t('Report - {{reportId}}', { reportId })}  | Pillage First! - ${serverSlug} - ${villageSlug}`;

  if (!report) {
    return (
      <PageContents>
        <title>{title}</title>
        <div className="flex flex-col gap-2">
          <Text as="h1">{t('Report not found')}</Text>
          <Text>
            {t(
              'This report could not be found. It may have been deleted or is no longer available.',
            )}
          </Text>
        </div>
        <div className="flex justify-start">
          <ReportsBackButton />
        </div>
      </PageContents>
    );
  }

  return (
    <PageContents>
      <title>{title}</title>
      <Report report={report}>
        <ReportHeader />
        {isBattleReport(report) && (
          <>
            <BattleParticipantTable
              participant={report.battle.attacker}
              participantRole="attacker"
            />
            <BattleParticipantTable
              participant={report.battle.defender}
              participantRole="defender"
            />
            {report.battle.outcome.canAttackerSeeFullReport &&
              report.battle.defender.reinforcements.map((participant) => (
                <BattleParticipantTable
                  key={participant.player.id}
                  participant={participant}
                  participantRole="reinforcement"
                />
              ))}
            <BattleStatisticsTable />
          </>
        )}
        {isAdventureReport(report) && (
          <>
            <AdventureHeroTable />
            <AdventureReportTable />
          </>
        )}
        {isTradeReport(report) && <TradeReportTable />}
        {isScoutingReport(report) && <ScoutingReportTables />}
        {isMovementReport(report) && <MovementReportTable />}
        {isHuntingPartyReport(report) && <HuntingPartyReportTable />}
        {isGatheringExpeditionReport(report) && (
          <GatheringExpeditionReportTable />
        )}
      </Report>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ReportsBackButton />
          <ReportNavigationButtons
            previousReportId={previousReportId}
            nextReportId={nextReportId}
          />
        </div>
        <ReportsListActions
          reports={[report]}
          updateReports={updateReports}
          deleteReports={deleteReports}
          onDelete={() =>
            navigate({
              pathname: '../reports',
              search: location.search,
            })
          }
        />
      </div>
    </PageContents>
  );
};

export default ReportPage;
