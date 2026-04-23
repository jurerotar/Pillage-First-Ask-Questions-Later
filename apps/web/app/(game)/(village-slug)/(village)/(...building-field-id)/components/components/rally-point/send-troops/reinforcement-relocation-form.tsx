import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { ErrorBag } from 'app/(game)/(village-slug)/components/error-bag';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { useVillageTroops } from 'app/(game)/(village-slug)/hooks/use-village-troops';
import { Text } from 'app/components/text';
import { Alert } from 'app/components/ui/alert';
import { Button } from 'app/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from 'app/components/ui/form';
import { RadioGroup, RadioGroupItem } from 'app/components/ui/radio-group';
import { useDialog } from 'app/hooks/use-dialog';
import { getFormErrorBag } from 'app/utils/forms';
import { TroopMovementConfirmationModal } from './components/confirmation-modal';
import { PlayerVillageSelector } from './components/target-selectors';
import { UnitSelector } from './components/unit-selector';
import { useTroopForm } from './hooks/use-troop-form';
import { baseTroopFormSchema } from './utils/schema';

const reinforcementRelocationFormSchema = baseTroopFormSchema.extend({
  action: z.enum(['reinforcement', 'relocation']),
});

const IS_REINFORCEMENTS_FORM_ENABLED = false;

export const ReinforcementRelocationForm = () => {
  const { t } = useTranslation();
  const { preferences } = usePreferences();
  const navigate = useNavigate();
  const { sendTroops } = useVillageTroops();

  const { form, getBaseEventArgs, resetForm, validateTroopMovementAsync } =
    useTroopForm(reinforcementRelocationFormSchema, {
      defaultValues: {
        action: 'reinforcement',
      },
    });

  const {
    isOpen: isConfirmationModalOpen,
    openModal,
    closeModal,
    modalArgs: formData,
  } = useDialog<z.infer<typeof reinforcementRelocationFormSchema>>();

  const onFormSubmit = async (
    data: z.infer<typeof reinforcementRelocationFormSchema>,
  ) => {
    const isValid = await validateTroopMovementAsync(
      data,
      data.action === 'reinforcement' ? 'reinforcements' : 'relocation',
    );

    if (isValid) {
      openModal(data);
    }
  };

  const onConfirm = () => {
    if (!formData.current) {
      return;
    }

    sendTroops(
      {
        type:
          formData.current.action === 'reinforcement'
            ? 'troopMovementReinforcements'
            : 'troopMovementRelocation',
        ...getBaseEventArgs(formData.current),
      },
      {
        onSuccess: () => {
          resetForm();
          closeModal();

          if (preferences.isAutomaticNavigationAfterSendUnitsEnabled) {
            navigate('..', { relative: 'path' });
          }
        },
      },
    );
  };

  return (
    <Section>
      <SectionContent>
        <Text as="h2">{t('Reinforce or relocate')}</Text>
      </SectionContent>
      <SectionContent>
        {!IS_REINFORCEMENTS_FORM_ENABLED && (
          <Alert variant="warning">
            {t('This page is still under development')}
          </Alert>
        )}
        {IS_REINFORCEMENTS_FORM_ENABLED && (
          <>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onFormSubmit)}
                className="space-y-6"
              >
                <UnitSelector />

                <div className="flex items-end gap-4">
                  <PlayerVillageSelector />

                  <FormField
                    control={form.control}
                    name="action"
                    render={({ field }) => (
                      <FormItem className="space-y-4 border-l dark:border-border pl-4">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-2"
                          >
                            <FormItem className="flex items-center space-x-4 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="reinforcement" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {t('Reinforcement')}
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-4 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="relocation" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {t('Relocation')}
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
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
                title={
                  formData.current.action === 'reinforcement'
                    ? t('Reinforcement')
                    : t('Relocation')
                }
              />
            )}
          </>
        )}
      </SectionContent>
    </Section>
  );
};
