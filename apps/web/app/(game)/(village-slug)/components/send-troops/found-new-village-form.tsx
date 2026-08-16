import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import { TroopMovementConfirmationModal } from './components/confirmation-modal';
import { TroopSelectionForm } from './components/troop-selection-form';
import { useFoundNewVillageTroopForm } from './hooks/use-found-new-village-troop-form';

export const FoundNewVillageForm = () => {
  const { t } = useTranslation();
  const { preferences } = usePreferences();
  const navigate = useNavigate();
  const {
    closeConfirmationStep,
    disabledUnitTiers,
    form,
    formData,
    isConfirmationStepOpen,
    maxUnits,
    onConfirm,
    onFormSubmit,
    tribe,
  } = useFoundNewVillageTroopForm({
    onSuccess: () => {
      if (preferences.isAutomaticNavigationAfterSendUnitsEnabled) {
        navigate('..', { relative: 'path' });
      }
    },
  });

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Found a new village')}</Text>
      </SectionContent>
      <SectionContent>
        <TroopSelectionForm
          form={form}
          onSubmit={onFormSubmit}
          units={{
            disabledUnitTiers,
            maxUnits,
          }}
          target={{
            selector: 'coordinates',
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
            title={t('Found a new village')}
            tribe={tribe}
            backLabel={t('Back')}
          />
        ) : null}
      </SectionContent>
    </Section>
  );
};
