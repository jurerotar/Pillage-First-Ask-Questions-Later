import { useTranslation } from 'react-i18next';
import { Alert } from 'app/components/ui/alert';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import { Text } from 'app/components/text';

export const HospitalTroopTraining = () => {
  const { t } = useTranslation();

  return (
    <Section>
      <SectionContent>
        <Bookmark tab="train" />
        <Text as="h2">{t('Train')}</Text>
        <Text>
          {t(
            'The Hospital allows you to treat wounded troops so they can rejoin your army. This helps you recover faster after major battles. Healing troops is not cheaper than training new ones, the resource cost is the same, but healing takes half the time of normal training.',
          )}
        </Text>
        <Text as="h3">{t('Wounded Troops')}</Text>
        <Text>
          {t(
            'When a village has a Hospital, 40% of its losses in any battle return as wounded troops.',
          )}
        </Text>
        <ul className="list-disc pl-4">
          <li>
            <Text>
              {t('Bandages do not affect how many troops become wounded.')}
            </Text>
          </li>
          <li>
            <Text>
              {t(
                'Siege engines, settlers, administrators and heroes cannot become wounded.',
              )}
            </Text>
          </li>
          <li>
            <Text>
              {t(
                'Troops that die while escaping from traps do not become wounded.',
              )}
            </Text>
          </li>
          <li>
            <Text>
              {t(
                'Only units from villages that had a Hospital at the time of the battle can become wounded.',
              )}
            </Text>
          </li>
          <li>{t('Wounded troops cannot fight and do not consume crop.')}</li>
        </ul>
        <Text as="h3">{t('Healing Troops')}</Text>
        <Text>
          {t(
            'The Hospital has its own healing queue, similar to the Barracks or Stable.',
          )}
        </Text>
        <ul className="list-disc pl-4">
          <li>
            <Text>
              {t('Healing costs the same resources as training the unit.')}
            </Text>
          </li>
          <li>
            <Text>{t('Both infantry and cavalry use the same queue.')}</Text>
          </li>
          <li>
            <Text>{t('Healing time depends on the Hospital level')}</Text>
          </li>
          <li>
            <Text>
              {t(
                'The Hospital heals units twice as fast as training in Barracks or Stable of the same level.',
              )}
            </Text>
          </li>
          <li>
            <Text>{t('Healing speed is not affected by:')}</Text>
          </li>
          <li className="list-none">
            <ul className="list-inside">
              <li>
                <Text>- {t('Artifacts')}</Text>
              </li>
              <li>
                <Text>- {t('Alliance Bonuses')}</Text>
              </li>
              <li>
                <Text>- {t('Hero Items')}</Text>
              </li>
              <li>
                <Text>- {t('Roman Horse Drinking Trough')}</Text>
              </li>
            </ul>
          </li>
        </ul>
        <Text as="h3">{t('Wounded Decay')}</Text>
        <Text>
          {t(
            'Wounded units that are not being healed die gradually at a rate of 10% per day. As soon as a wounded unit enters the healing queue, it stops decaying.',
          )}
        </Text>
        <Text as="h3">{t('Hospital Deconstruction and Conquest')}</Text>
        <ul className="list-disc pl-4">
          <li>
            <Text>
              {t(
                'If the Hospital is destroyed, the healing queue continues normally.',
              )}
            </Text>
          </li>
          <li>
            <Text>
              {t('Wounded troops continue decaying at the usual 10% per day.')}
            </Text>
          </li>
          <li>
            <Text>
              {t(
                'If the Hospital is destroyed during a battle, wounded troops from that battle are still generated but remain inaccessible until the Hospital is rebuilt.',
              )}
            </Text>
          </li>
          <li>
            <Text>
              {t(
                'If the village is conquered, all troops, including wounded, are destroyed.',
              )}
            </Text>
          </li>
        </ul>
      </SectionContent>
      <SectionContent>
        <Alert variant="warning">
          {t('This page is still under development')}
        </Alert>
      </SectionContent>
    </Section>
  );
};
