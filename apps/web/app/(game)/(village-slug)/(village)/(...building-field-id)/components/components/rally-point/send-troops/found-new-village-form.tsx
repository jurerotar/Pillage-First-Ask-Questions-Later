import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';
import { getSettlerUnitIdByTribe } from '@pillage-first/game-assets/utils/units';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout.tsx';
import { ErrorBag } from 'app/(game)/(village-slug)/components/error-bag.tsx';
import { useCreateEvent } from 'app/(game)/(village-slug)/hooks/use-create-event.ts';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe.ts';
import { Text } from 'app/components/text.tsx';
import { Button } from 'app/components/ui/button.tsx';
import { Form } from 'app/components/ui/form.tsx';
import { getFormErrorBag } from 'app/utils/forms.ts';
import { CoordinateSelector } from './components/target-selectors.tsx';
import { UnitSelector } from './components/unit-selector.tsx';
import { useTroopForm } from './hooks/use-troop-form.ts';
import { foundNewVillageFormSchema } from './utils/schema.ts';

export const FoundNewVillageForm = () => {
  const { t } = useTranslation();
  const tribe = useTribe();
  const { createEvent: createFindNewVillageEvent } = useCreateEvent(
    'troopMovementFindNewVillage',
  );

  const settlerUnitId = getSettlerUnitIdByTribe(tribe);

  const defaultUnits = useMemo(() => {
    return [{ unitId: settlerUnitId, amount: 3 }];
  }, [settlerUnitId]);

  const maxUnits = useMemo(() => {
    return [{ unitId: settlerUnitId, amount: 3 }];
  }, [settlerUnitId]);

  const { form, getBaseEventArgs, resetForm } = useTroopForm(
    foundNewVillageFormSchema,
    {
      defaultValues: {},
      defaultUnits,
    },
  );

  const onFormSubmit = (data: z.infer<typeof foundNewVillageFormSchema>) => {
    const eventArgs = getBaseEventArgs(data);

    createFindNewVillageEvent(eventArgs, {
      onSuccess: () => {
        resetForm();
      },
    });
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
      </SectionContent>
    </Section>
  );
};
