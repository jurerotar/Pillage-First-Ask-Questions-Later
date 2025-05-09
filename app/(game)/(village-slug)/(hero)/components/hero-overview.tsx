import { Alert } from 'app/components/ui/alert';
import { useTranslation } from 'react-i18next';
import { Text } from 'app/components/text';

export const HeroOverview = () => {
  const { t } = useTranslation();

  return (
    <article className="flex flex-col gap-2">
      <Text as="h2">{t('Hero overview')}</Text>
      <Alert variant="warning">{t('This page is still under development')}</Alert>
    </article>
  );
};
