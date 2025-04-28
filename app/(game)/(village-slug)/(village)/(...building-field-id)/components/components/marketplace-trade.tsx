import { useTranslation } from 'react-i18next';
import { WarningAlert } from 'app/components/alert';

export const MarketplaceTrade = () => {
  const { t } = useTranslation();

  return <WarningAlert>{t('This page is still under development')}</WarningAlert>;
};
