import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
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
import { InformationPopover } from 'app/(game)/components/information-popover';
import { PageContents } from 'app/components/page-contents';
import { Text } from 'app/components/text';
import { useReport } from '../../hooks/use-report';
import { ReportsListActions } from '../components/reports-list-actions';
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
  ScoutingReportTables,
  TradeReportTable,
} from './components/report';

const ReportPage = ({ params }: Route.ComponentProps) => {
  const { reportId: reportIdParam, villageSlug, serverSlug } = params;
  const { t } = useTranslation();
  const navigate = useNavigate();

  const reportId = Number.parseInt(reportIdParam, 10);
  const { report } = useReport(reportId);
  const { updateReports, deleteReports } = useReports();

  const title = `${t('Report - {{reportId}}', { reportId })}  | Pillage First! - ${serverSlug} - ${villageSlug}`;

  return (
    <PageContents>
      <title>{title}</title>
      <InformationPopover
        ariaLabel={t('Report - {{reportId}}', { reportId })}
        className="top-2 right-2"
      >
        <Text>{t('Review the selected in-game report.')}</Text>
      </InformationPopover>
      {!report && <Text as="h1">Report not found</Text>}
      {report && (
        <>
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
          <div className="flex justify-end">
            <ReportsListActions
              reports={[report]}
              updateReports={updateReports}
              deleteReports={deleteReports}
              onDelete={() => navigate('../reports')}
            />
          </div>
        </>
      )}
    </PageContents>
  );
};

export default ReportPage;
