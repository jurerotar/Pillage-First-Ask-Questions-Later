import { useTranslation } from 'react-i18next';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Text } from 'app/components/text';
import { Alert } from 'app/components/ui/alert';

export const RallyPointSimulator = () => {
  const { t } = useTranslation();

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="simulator" />
        <InformationPopover ariaLabel={t('Simulator')}>
          <Text>
            {t(
              'Use the simulator to estimate battle outcomes before sending troops. Results depend on the units, defenses, bonuses, and wall levels you enter.',
            )}
          </Text>
        </InformationPopover>
        <Text as="h2">{t('Simulator')}</Text>
      </SectionContent>
      <SectionContent>
        <Alert variant="warning">
          {t('This page is still under development')}
        </Alert>
      </SectionContent>
    </Section>
  );
};
