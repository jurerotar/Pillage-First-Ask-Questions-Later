import { useTranslation } from 'react-i18next';
import { WarningAlert } from 'app/components/ui/alert';

export const BreweryCelebration = () => {
  const { t } = useTranslation();

  return <WarningAlert>{t('This page is still under development')}</WarningAlert>;
};
