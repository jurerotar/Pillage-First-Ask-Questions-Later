import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import type { z } from 'zod';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout.tsx';
import { ErrorBag } from 'app/(game)/(village-slug)/components/error-bag.tsx';
import { useCreateEvent } from 'app/(game)/(village-slug)/hooks/use-create-event.ts';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences.ts';
import { Text } from 'app/components/text.tsx';
import { Button } from 'app/components/ui/button.tsx';
import { Form } from 'app/components/ui/form.tsx';
import { useDialog } from 'app/hooks/use-dialog.ts';
import { getFormErrorBag } from 'app/utils/forms.ts';
import { TroopMovementConfirmationModal } from './components/confirmation-modal.tsx';
import { CoordinateSelector } from './components/target-selectors.tsx';
import { UnitSelector } from './components/unit-selector.tsx';
import { useTroopForm } from './hooks/use-troop-form.ts';
import { baseTroopFormSchema } from './utils/schema.ts';

const oasisOccupationFormSchema = baseTroopFormSchema;

export const OasisOccupationForm = () => {
  const { t } = useTranslation();
  const { preferences } = usePreferences();
  const navigate = useNavigate();
  const { createEvent: createOasisOccupationEvent } = useCreateEvent(
    'troopMovementOasisOccupation',
  );

  const { form, getBaseEventArgs, resetForm, validateTroopMovementAsync } =
    useTroopForm(oasisOccupationFormSchema, {
      defaultValues: {},
    });

  const {
    isOpen: isConfirmationModalOpen,
    openModal,
    closeModal,
    modalArgs: formData,
  } = useDialog<z.infer<typeof oasisOccupationFormSchema>>();

  const onFormSubmit = async (
    data: z.infer<typeof oasisOccupationFormSchema>,
  ) => {
    const isValid = await validateTroopMovementAsync(data, 'oasisOccupation');

    if (isValid) {
      openModal(data);
    }
  };

  const onConfirm = () => {
    if (!formData.current) {
      return;
    }

    const eventArgs = getBaseEventArgs(formData.current);

    createOasisOccupationEvent(eventArgs, {
      onSuccess: () => {
        resetForm();
        closeModal();

        if (preferences.isAutomaticNavigationAfterSendUnitsEnabled) {
          navigate('..', { relative: 'path' });
        }
      },
    });
  };

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Occupy oasis')}</Text>
      </SectionContent>
      <SectionContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onFormSubmit)}
            className="space-y-6"
          >
            <UnitSelector />

            <div className="flex items-end gap-8">
              <CoordinateSelector />
            </div>

            <ErrorBag errorBag={getFormErrorBag(form.formState.errors)} />

            <Button type="submit">{t('Confirm')}</Button>
          </form>
        </Form>

        {formData.current && (
          <TroopMovementConfirmationModal
            isOpen={isConfirmationModalOpen}
            onClose={closeModal}
            onConfirm={onConfirm}
            formData={formData.current}
            title={t('Occupy oasis')}
          />
        )}
      </SectionContent>
    </Section>
  );
};
