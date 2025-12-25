import { useTranslation } from 'react-i18next';
import type { Route } from '@react-router/types/app/(game)/(village-slug)/(reports)/(...report-id)/+types/page';
import { Alert } from 'app/components/ui/alert';

const ReportPage = ({ params }: Route.ComponentProps) => {
  const { reportId: _reportId } = params;
  const { t } = useTranslation();

  return (
    <Alert variant="warning">{t('This page is still under development')}</Alert>
  );
};

export default ReportPage;
