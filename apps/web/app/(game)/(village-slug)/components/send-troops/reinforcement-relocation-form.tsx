import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import { TroopMovementConfirmationContent } from './components/confirmation-modal';
import { ReinforcementRelocationActionSelector } from './components/reinforcement-relocation-action-selector';
import { TroopSelectionForm } from './components/troop-selection-form';
import { useReinforcementRelocationTroopForm } from './hooks/use-reinforcement-relocation-troop-form';

export const ReinforcementRelocationForm = () => {
  const { t } = useTranslation();
  const { preferences } = usePreferences();
  const navigate = useNavigate();
  const {
    closeConfirmationStep,
    form,
    formData,
    isConfirmationStepOpen,
    onConfirm,
    onFormSubmit,
    tribe,
  } = useReinforcementRelocationTroopForm({
    onSuccess: () => {
      if (preferences.isAutomaticNavigationAfterSendUnitsEnabled) {
        navigate('..', { relative: 'path' });
      }
    },
  });

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Reinforce or relocate')}</Text>
      </SectionContent>
      <SectionContent>
        {isConfirmationStepOpen && formData.current ? (
          <TroopMovementConfirmationContent
            onBack={closeConfirmationStep}
            onConfirm={onConfirm}
            formData={formData.current}
            tribe={tribe}
            title={
              formData.current.action === 'reinforcement'
                ? t('Reinforcement')
                : t('Relocation')
            }
            backLabel={t('Back')}
          />
        ) : (
          <TroopSelectionForm
            form={form}
            onSubmit={onFormSubmit}
            targetSelector="playerVillage"
            extraTargetContent={<ReinforcementRelocationActionSelector />}
            actions={<Button type="submit">{t('Confirm')}</Button>}
          />
        )}
      </SectionContent>
    </Section>
  );
};
