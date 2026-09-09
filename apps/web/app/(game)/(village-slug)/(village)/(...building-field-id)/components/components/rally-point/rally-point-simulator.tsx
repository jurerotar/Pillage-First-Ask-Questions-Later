import { useTranslation } from 'react-i18next';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import { CombatSimulatorAttackerControlsRow } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/rally-point/components/simulator/components/combat-simulator-attacker-controls-row';
import { CombatSimulatorDefenderControlsRow } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/rally-point/components/simulator/components/combat-simulator-defender-controls-row';
import { CombatSimulatorReinforcementsControlsRows } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/rally-point/components/simulator/components/combat-simulator-reinforcements-controls-rows';
import { CombatSimulatorProvider } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/rally-point/components/simulator/providers/combat-simulator-provider';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Text } from 'app/components/text';

const RallyPointSimulatorContent = () => {
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
        <div className="flex flex-col gap-4">
          <CombatSimulatorAttackerControlsRow />
          <CombatSimulatorDefenderControlsRow />
          <CombatSimulatorReinforcementsControlsRows />
        </div>
      </SectionContent>
    </Section>
  );
};

export const RallyPointSimulator = () => {
  return (
    <CombatSimulatorProvider>
      <RallyPointSimulatorContent />
    </CombatSimulatorProvider>
  );
};
