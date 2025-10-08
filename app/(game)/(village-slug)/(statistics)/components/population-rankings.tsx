import { Pagination } from 'app/components/ui/pagination';
import { useTranslation } from 'react-i18next';
import { Alert } from 'app/components/ui/alert';
import { usePagination } from 'app/(game)/(village-slug)/hooks/use-pagination';
import { Section } from 'app/(game)/(village-slug)/components/building-layout';
import { Text } from 'app/components/text';

export const PopulationRankings = () => {
  const { t } = useTranslation();

  const pagination = usePagination([], 50);

  return (
    <Section>
      <Text as="h2">{t('Population rankings')}</Text>
      <Text>
        {t(
          'A paginated list of player sorted by total population of all their villages.',
        )}
      </Text>
      <Alert variant="warning">
        {t('This page is still under development')}
      </Alert>
      <div className="flex w-full justify-end">
        <Pagination {...pagination} />
      </div>
    </Section>
  );
};
