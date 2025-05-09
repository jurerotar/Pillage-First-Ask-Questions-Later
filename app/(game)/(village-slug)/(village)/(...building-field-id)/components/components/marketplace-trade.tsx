import { useTranslation } from 'react-i18next';
import { Alert } from 'app/components/ui/alert';

export const MarketplaceTrade = () => {
  const { t } = useTranslation();

  return <Alert variant="warning">{t('This page is still under development')}</Alert>;
};
