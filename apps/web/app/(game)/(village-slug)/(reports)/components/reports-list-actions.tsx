import { useTranslation } from 'react-i18next';
import type { BaseReport, ReportTag } from '@pillage-first/types/models/report';
import type {
  ReportScope,
  useReports,
} from 'app/(game)/(village-slug)/hooks/use-reports';
import { Button } from 'app/components/ui/button';

type ReportsListActionsProps = {
  scope: ReportScope;
  selectedReportIds: BaseReport['id'][];
  updateReports: ReturnType<typeof useReports>['updateReports'];
  deleteReports: ReturnType<typeof useReports>['deleteReports'];
  clearSelectedReports: () => void;
};

export const ReportsListActions = ({
  scope,
  selectedReportIds,
  updateReports,
  deleteReports,
  clearSelectedReports,
}: ReportsListActionsProps) => {
  const { t } = useTranslation();
  const disabled = selectedReportIds.length === 0;

  const updateSelectedReports = (tags: Partial<Record<ReportTag, boolean>>) => {
    updateReports({ reportIds: selectedReportIds, tags });
    clearSelectedReports();
  };

  const deleteSelectedReports = () => {
    deleteReports({ reportIds: selectedReportIds });
    clearSelectedReports();
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        disabled={disabled}
        onClick={deleteSelectedReports}
      >
        {t('Delete')}
      </Button>
      <Button
        disabled={disabled}
        onClick={() => updateSelectedReports({ read: true })}
      >
        {t('Read')}
      </Button>
      {scope !== 'unread' && (
        <Button
          disabled={disabled}
          onClick={() => updateSelectedReports({ read: false })}
        >
          {t('Unread')}
        </Button>
      )}
      {scope !== 'archived' && (
        <Button
          disabled={disabled}
          onClick={() => updateSelectedReports({ archived: true })}
        >
          {t('Archive')}
        </Button>
      )}
      <Button
        disabled={disabled}
        onClick={() => updateSelectedReports({ archived: false })}
      >
        {t('Unarchive')}
      </Button>
    </div>
  );
};
