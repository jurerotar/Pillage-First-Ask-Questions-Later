import { useTranslation } from 'react-i18next';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Text } from 'app/components/text';
import { Alert } from 'app/components/ui/alert';

export const EmbassyRelations = () => {
  const { t } = useTranslation();

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="relations" />
        <InformationPopover ariaLabel={t('Relations')}>
          <Text>
            {t(
              'Relations show the alliances, confederacies, and diplomatic standings connected to your village or alliance.',
            )}
          </Text>
        </InformationPopover>
        <Text as="h2">{t('Relations')}</Text>
      </SectionContent>
      <SectionContent>
        <Alert variant="warning">
          {t('This page is still under development')}
        </Alert>
      </SectionContent>
    </Section>
  );
};
