import { useTranslation } from 'react-i18next';
import { Alert } from 'app/components/ui/alert';
import { Section, SectionContent } from 'app/(game)/(village-slug)/components/building-layout';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import { Text } from 'app/components/text';

export const PalaceLoyalty = () => {
  const { t } = useTranslation();

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="loyalty" />
        <Text as="h2">{t('Loyalty')}</Text>
        <Text as="p">
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Accusantium ad autem distinctio nesciunt officia quas qui similique.
          Aperiam atque et excepturi fugiat labore quidem sed sit tempore totam voluptas. Iure!
        </Text>
      </SectionContent>
      <SectionContent>
        <Alert variant="warning">{t('This page is still under development')}</Alert>
      </SectionContent>
    </Section>
  );
};
