import { useTranslation } from 'react-i18next';
import { Section } from 'app/(game)/(village-slug)/components/building-layout';
import { usePagination } from 'app/(game)/(village-slug)/hooks/use-pagination';
import { Text } from 'app/components/text';
import { Alert } from 'app/components/ui/alert';
import { Pagination } from 'app/components/ui/pagination';

export const VillageRankings = () => {
  const { t } = useTranslation();

  const pagination = usePagination([], 50);

  return (
    <Section>
      <Text as="h2">{t('Village rankings')}</Text>
      <Text>{t('A paginated list of villages sorted by population.')}</Text>
      <Alert variant="warning">
        {t('This page is still under development')}
      </Alert>
      <div className="flex w-full justify-end">
        <Pagination {...pagination} />
      </div>
    </Section>
  );
};
