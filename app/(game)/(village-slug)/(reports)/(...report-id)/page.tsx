import { useTranslation } from 'react-i18next';
import { Alert } from 'app/components/ui/alert';
import type { Route } from '.react-router/types/app/(game)/(village-slug)/(reports)/(...report-id)/+types/page';

const ReportPage = ({ params }: Route.ComponentProps) => {
  const { reportId: _reportId } = params;
  const { t } = useTranslation();

  return (
    <Alert variant="warning">{t('This page is still under development')}</Alert>
  );
};

export default ReportPage;
