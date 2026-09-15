import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { TroopMovementConfirmationModal } from 'app/(game)/(village-slug)/components/send-troops/components/confirmation-modal';
import { ReinforcementRelocationActionSelector } from 'app/(game)/(village-slug)/components/send-troops/components/reinforcement-relocation-action-selector';
import { TroopSelectionForm } from 'app/(game)/(village-slug)/components/send-troops/components/troop-selection-form';
import { useReinforcementRelocationTroopForm } from 'app/(game)/(village-slug)/components/send-troops/hooks/use-reinforcement-relocation-troop-form';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';

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
        <TroopSelectionForm
          form={form}
          onSubmit={onFormSubmit}
          target={{
            selector: 'coordinates',
            extraContent: <ReinforcementRelocationActionSelector />,
          }}
          footer={{
            content: <Button type="submit">{t('Confirm')}</Button>,
          }}
        />
        {formData.current ? (
          <TroopMovementConfirmationModal
            isOpen={isConfirmationStepOpen}
            onClose={closeConfirmationStep}
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
        ) : null}
      </SectionContent>
    </Section>
  );
};
