import { WarningAlert } from 'app/components/alert';
import { useTranslation } from 'react-i18next';

const ReportsPage = () => {
  const { t } = useTranslation();

  return <WarningAlert>{t('This page is still under development')}</WarningAlert>;
};

export default ReportsPage;
