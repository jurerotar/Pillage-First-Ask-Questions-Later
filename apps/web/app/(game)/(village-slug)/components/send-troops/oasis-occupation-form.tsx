import type { DefaultValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import type { z } from 'zod';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import { TroopMovementConfirmationModal } from './components/confirmation-modal';
import { TroopSelectionForm } from './components/troop-selection-form';
import { useTroopMovementForm } from './hooks/use-troop-movement-form';
import { baseTroopFormSchema } from './utils/schema';

const oasisOccupationFormSchema = baseTroopFormSchema;
type OasisOccupationFormValues = z.infer<typeof oasisOccupationFormSchema>;

const oasisOccupationDefaultValues =
  {} satisfies DefaultValues<OasisOccupationFormValues>;

export const OasisOccupationForm = () => {
  const { t } = useTranslation();
  const { preferences } = usePreferences();
  const navigate = useNavigate();
  const tribe = useTribe();
  const {
    closeConfirmationStep,
    form,
    formData,
    isConfirmationStepOpen,
    onConfirm,
    onFormSubmit,
  } = useTroopMovementForm({
    schema: oasisOccupationFormSchema,
    formOptions: {
      defaultValues: oasisOccupationDefaultValues,
    },
    getMovementValidationType: () => 'oasisOccupation',
    getEventType: () => 'troopMovementOasisOccupation',
    onSuccess: () => {
      if (preferences.isAutomaticNavigationAfterSendUnitsEnabled) {
        navigate('..', { relative: 'path' });
      }
    },
  });

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Occupy oasis')}</Text>
      </SectionContent>
      <SectionContent>
        <TroopSelectionForm
          form={form}
          onSubmit={onFormSubmit}
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
            title={t('Occupy oasis')}
            tribe={tribe}
            backLabel={t('Back')}
          />
        ) : null}
      </SectionContent>
    </Section>
  );
};
