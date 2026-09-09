import { use } from 'react';
import { useTranslation } from 'react-i18next';
import { LuArrowLeftRight, LuShieldPlus } from 'react-icons/lu';
import { Bookmark } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/bookmark';
import {
  CombatSimulatorContext,
  CombatSimulatorProvider,
} from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/rally-point/providers/combat-simulator-context';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';

const RallyPointSimulatorContent = () => {
  const { t } = useTranslation();
  const combatSimulator = use(CombatSimulatorContext)!;
  const { addDefenderReinforcement, swapAttackerAndPrimaryDefender } =
    combatSimulator;

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
        <div className="flex items-center justify-end gap-2">
          <Button
            aria-label={t('Swap attacker and defender')}
            data-tooltip-content={t('Swap attacker and defender')}
            data-tooltip-id="general-tooltip"
            variant="outline"
            size="icon"
            onClick={swapAttackerAndPrimaryDefender}
          >
            <LuArrowLeftRight />
          </Button>
          <Button
            aria-label={t('Add defender')}
            data-tooltip-content={t('Add defender')}
            data-tooltip-id="general-tooltip"
            variant="outline"
            size="icon"
            onClick={() => {
              addDefenderReinforcement();
            }}
          >
            <LuShieldPlus />
          </Button>
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
