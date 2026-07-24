import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import type { BaseReport, ReportTag } from '@pillage-first/types/models/report';
import type { useReports } from 'app/(game)/(village-slug)/hooks/use-reports';
import { Button } from 'app/components/ui/button';

type ReportsListActionsProps = {
  reports: Pick<BaseReport, 'id' | 'tags'>[];
  updateReports: ReturnType<typeof useReports>['updateReports'];
  deleteReports: ReturnType<typeof useReports>['deleteReports'];
  onAction?: () => void;
  onDelete?: () => void;
  isPopoverActions?: boolean;
};

export const ReportsListActions = ({
  reports,
  updateReports,
  deleteReports,
  onAction,
  onDelete,
  isPopoverActions = false,
}: ReportsListActionsProps) => {
  const { t } = useTranslation();
  const reportIds = reports.map(({ id }) => id);
  const canMarkAsRead = reports.some(({ tags }) => !tags.includes('read'));
  const canMarkAsUnread = reports.some(({ tags }) => tags.includes('read'));
  const canArchive = reports.some(({ tags }) => !tags.includes('archived'));
  const canUnarchive = reports.some(({ tags }) => tags.includes('archived'));
  const actionVariant = isPopoverActions ? 'ghost' : 'outline';

  const updateSelectedReports = (tags: Partial<Record<ReportTag, boolean>>) => {
    updateReports({ reportIds, tags });
    onAction?.();
  };

  const deleteSelectedReports = () => {
    deleteReports({ reportIds });
    onDelete?.();
    onAction?.();
  };

  return (
    <div
      className={clsx(
        'flex',
        isPopoverActions ? 'flex-col' : 'flex-row flex-wrap gap-2',
      )}
    >
      <Button
        aria-label={t('Delete')}
        title={t('Delete')}
        variant={actionVariant}
        onClick={deleteSelectedReports}
        size={isPopoverActions ? 'default' : 'sm'}
      >
        {t('Delete')}
      </Button>
      {canMarkAsRead && (
        <Button
          aria-label={t('Read')}
          title={t('Read')}
          variant={actionVariant}
          onClick={() => updateSelectedReports({ read: true })}
          size={isPopoverActions ? 'default' : 'sm'}
        >
          {t('Read')}
        </Button>
      )}
      {canMarkAsUnread && (
        <Button
          aria-label={t('Unread')}
          title={t('Unread')}
          variant={actionVariant}
          onClick={() => updateSelectedReports({ read: false })}
          size={isPopoverActions ? 'default' : 'sm'}
        >
          {t('Unread')}
        </Button>
      )}
      {canArchive && (
        <Button
          aria-label={t('Archive')}
          title={t('Archive')}
          variant={actionVariant}
          onClick={() => updateSelectedReports({ archived: true })}
          size={isPopoverActions ? 'default' : 'sm'}
        >
          {t('Archive')}
        </Button>
      )}
      {canUnarchive && (
        <Button
          aria-label={t('Unarchive')}
          title={t('Unarchive')}
          variant={actionVariant}
          onClick={() => updateSelectedReports({ archived: false })}
          size={isPopoverActions ? 'default' : 'sm'}
        >
          {t('Unarchive')}
        </Button>
      )}
    </div>
  );
};
