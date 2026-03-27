import { useTranslation } from 'react-i18next';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useEventsByType } from 'app/(game)/(village-slug)/hooks/use-events-by-type';
import { useLoyalty } from 'app/(game)/(village-slug)/hooks/use-loyalty';
import { Text } from 'app/components/text';
import { Alert } from 'app/components/ui/alert';

export const ResidenceLoyalty = () => {
  const { t } = useTranslation();
  const { loyalty } = useLoyalty();
  const { eventsByType: loyaltyIncreaseEvents } =
    useEventsByType('loyaltyIncrease');

  const [nextLoyaltyIncreaseEvent] = loyaltyIncreaseEvents;

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="loyalty" />
        <Text as="h2">{t('Loyalty')}</Text>
        <Text>
          {t(
            "Loyalty determines how firmly a village belongs to your realm. Every village begins with 100% loyalty. When loyalty drops to 0%, the village will switch allegiance and become part of the attacker's realm.",
          )}
        </Text>
        <Text as="h3">{t('How Loyalty Works')}</Text>
        <Text>
          {t(
            "A village's loyalty cannot decrease as long as the Residence exists in the village. If Residence does not exist, loyalty can be reduced by attacks with administrators. Once loyalty reaches 0%, the village is conquered.",
          )}
        </Text>
        <Text as="h3">{t('Increasing Loyalty')}</Text>
        <Text>
          {t(
            'Loyalty automatically increases over time when a Residence exists in the village.',
          )}
        </Text>
        <ul className="list-disc pl-4">
          <li>
            <Text>
              {t(
                'Each level of the Residence increases loyalty by 1% + 1% base every hour, up to a maximum of 100%.',
              )}
            </Text>
          </li>
          <li>
            <Text>{t('Certain hero items may further increase loyalty.')}</Text>
          </li>
        </ul>
      </SectionContent>
      <SectionContent>
        <Text>
          {t('Current loyalty:')} <strong>{loyalty}%</strong>
        </Text>
        {loyalty < 100 && nextLoyaltyIncreaseEvent && (
          <Text>
            {t('Next increase in:')}{' '}
            <Countdown
              endsAt={
                nextLoyaltyIncreaseEvent.startsAt +
                nextLoyaltyIncreaseEvent.duration
              }
            />
          </Text>
        )}
        {loyalty === 100 && (
          <Alert variant="info">{t('Village loyalty is at maximum.')}</Alert>
        )}
      </SectionContent>
    </Section>
  );
};
