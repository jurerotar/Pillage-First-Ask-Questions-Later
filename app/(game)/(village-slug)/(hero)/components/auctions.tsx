import { WarningAlert } from 'app/components/ui/alert';
import { useTranslation } from 'react-i18next';
import { Text } from 'app/components/text';

export const Auctions = () => {
  const { t } = useTranslation();

  return (
    <article className="flex flex-col gap-2">
      <Text as="h2">{t('Auctions')}</Text>
      <WarningAlert>{t('This page is still under development')}</WarningAlert>
    </article>
  );
};
