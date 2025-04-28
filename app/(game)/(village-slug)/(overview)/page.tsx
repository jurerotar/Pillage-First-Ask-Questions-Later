import { useTranslation } from 'react-i18next';
import { WarningAlert } from 'app/components/alert';

const OverviewPage = () => {
  const { t } = useTranslation();

  return <WarningAlert>{t('This page is still under development')}</WarningAlert>;
};

export default OverviewPage;
