import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import type { z } from 'zod';
import { getSettlerUnitIdByTribe } from '@pillage-first/game-assets/utils/units';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { ErrorBag } from 'app/(game)/(village-slug)/components/error-bag';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { useVillageTroops } from 'app/(game)/(village-slug)/hooks/use-village-troops';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import { Form } from 'app/components/ui/form';
import { useDialog } from 'app/hooks/use-dialog';
import { getFormErrorBag } from 'app/utils/forms';
import { TroopMovementConfirmationModal } from './components/confirmation-modal';
import { CoordinateSelector } from './components/target-selectors';
import { UnitSelector } from './components/unit-selector';
import { useTroopForm } from './hooks/use-troop-form';
import { foundNewVillageFormSchema } from './utils/schema';

export const FoundNewVillageForm = () => {
  const { t } = useTranslation();
  const { preferences } = usePreferences();
  const navigate = useNavigate();
  const tribe = useTribe();
  const { sendTroops } = useVillageTroops();

  const settlerUnitId = getSettlerUnitIdByTribe(tribe);

  const defaultUnits = useMemo(() => {
    return [{ unitId: settlerUnitId, amount: 3 }];
  }, [settlerUnitId]);

  const maxUnits = useMemo(() => {
    return [{ unitId: settlerUnitId, amount: 3 }];
  }, [settlerUnitId]);

  const { form, getBaseEventArgs, resetForm, validateTroopMovementAsync } =
    useTroopForm(foundNewVillageFormSchema, {
      defaultValues: {},
      defaultUnits,
    });

  const {
    isOpen: isConfirmationModalOpen,
    openModal,
    closeModal,
    modalArgs: formData,
  } = useDialog<z.infer<typeof foundNewVillageFormSchema>>();

  const onFormSubmit = async (
    data: z.infer<typeof foundNewVillageFormSchema>,
  ) => {
    const isValid = await validateTroopMovementAsync(data, 'findNewVillage');

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
        type: 'troopMovementFindNewVillage',
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
        <Text as="h2">{t('Found a new village')}</Text>
      </SectionContent>
      <SectionContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onFormSubmit)}
            className="space-y-6"
          >
            <UnitSelector
              disabledUnitTiers={[
                'tier-1',
                'tier-2',
                'tier-3',
                'scout',
                'tier-4',
                'tier-5',
                'siege-ram',
                'siege-catapult',
                'administration',
                'hero',
              ]}
              maxUnits={maxUnits}
            />

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
            title={t('Found a new village')}
          />
        )}
      </SectionContent>
    </Section>
  );
};
