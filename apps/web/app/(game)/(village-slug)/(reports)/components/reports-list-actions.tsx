import { useTranslation } from 'react-i18next';
import { Button } from 'app/components/ui/button';
import type { ReportScope } from './reports-tabs';

type ReportsListActionsProps = {
  scope: ReportScope;
  disabled: boolean;
  onDelete: () => void;
  onMarkAsRead: () => void;
  onMarkAsUnread: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
};

export const ReportsListActions = ({
  scope,
  disabled,
  onDelete,
  onMarkAsRead,
  onMarkAsUnread,
  onArchive,
  onUnarchive,
}: ReportsListActionsProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        disabled={disabled}
        onClick={onDelete}
      >
        {t('Delete')}
      </Button>
      <Button
        disabled={disabled}
        onClick={onMarkAsRead}
      >
        {t('Read')}
      </Button>
      {scope !== 'unread' && (
        <Button
          disabled={disabled}
          onClick={onMarkAsUnread}
        >
          {t('Unread')}
        </Button>
      )}
      {scope !== 'archived' && (
        <Button
          disabled={disabled}
          onClick={onArchive}
        >
          {t('Archive')}
        </Button>
      )}
      <Button
        disabled={disabled}
        onClick={onUnarchive}
      >
        {t('Unarchive')}
      </Button>
    </div>
  );
};
