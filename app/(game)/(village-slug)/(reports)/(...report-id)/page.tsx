import { useRouteSegments } from 'app/(game)/(village-slug)/hooks/routes/use-route-segments';
import { useTranslation } from 'react-i18next';
import { WarningAlert } from 'app/components/ui/alert';

const ReportPage = () => {
  const { reportId: _reportId } = useRouteSegments();
  const { t } = useTranslation();

  return <WarningAlert>{t('This page is still under development')}</WarningAlert>;
};

export default ReportPage;
