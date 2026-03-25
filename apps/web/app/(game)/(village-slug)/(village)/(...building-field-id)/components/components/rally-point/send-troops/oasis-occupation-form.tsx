import { useTranslation } from 'react-i18next';
import type { z } from 'zod';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout.tsx';
import { ErrorBag } from 'app/(game)/(village-slug)/components/error-bag.tsx';
import { useCreateEvent } from 'app/(game)/(village-slug)/hooks/use-create-event.ts';
import { Text } from 'app/components/text.tsx';
import { Button } from 'app/components/ui/button.tsx';
import { Form } from 'app/components/ui/form.tsx';
import { getFormErrorBag } from 'app/utils/forms.ts';
import { CoordinateSelector } from './components/target-selectors.tsx';
import { UnitSelector } from './components/unit-selector.tsx';
import { useTroopForm } from './hooks/use-troop-form.ts';
import { baseTroopFormSchema } from './utils/schema.ts';

const oasisOccupationFormSchema = baseTroopFormSchema;

export const OasisOccupationForm = () => {
  const { t } = useTranslation();
  const { createEvent: createOasisOccupationEvent } = useCreateEvent(
    'troopMovementOasisOccupation',
  );

  const { form, getBaseEventArgs } = useTroopForm(oasisOccupationFormSchema, {
    target: { x: 0, y: 0 },
  });

  const onFormSubmit = (data: z.infer<typeof oasisOccupationFormSchema>) => {
    const eventArgs = getBaseEventArgs(data);

    createOasisOccupationEvent(eventArgs);
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
      </SectionContent>
    </Section>
  );
};
