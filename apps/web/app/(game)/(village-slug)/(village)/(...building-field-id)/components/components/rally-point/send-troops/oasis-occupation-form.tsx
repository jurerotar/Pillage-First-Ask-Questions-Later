import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import {
  getUnitDefinition,
  getUnitsByTribe,
} from '@pillage-first/game-assets/utils/units';
import {
  unitCategorySchema,
  unitIdSchema,
  unitTierSchema,
} from '@pillage-first/types/models/unit';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout.tsx';
import { ErrorBag } from 'app/(game)/(village-slug)/components/error-bag.tsx';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village.ts';
import { useCreateEvent } from 'app/(game)/(village-slug)/hooks/use-create-event.ts';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe.ts';
import { useVillageTroops } from 'app/(game)/(village-slug)/hooks/use-village-troops.ts';
import { villageTroopsCacheKey } from 'app/(game)/constants/query-keys.ts';
import { Text } from 'app/components/text.tsx';
import { Button } from 'app/components/ui/button.tsx';
import { Form } from 'app/components/ui/form.tsx';
import { getFormErrorBag } from 'app/utils/forms.ts';
import { CoordinateSelector } from './components/target-selectors.tsx';
import { UnitSelector } from './components/unit-selector.tsx';

const unitSelectionSchema = z.object({
  unitId: unitIdSchema,
  selected: z.coerce.number().int().nonnegative().default(0),
  available: z.number().int().nonnegative(),
  tier: unitTierSchema,
  category: unitCategorySchema,
});

const targetSchema = z.strictObject({
  x: z.coerce.number().int(),
  y: z.coerce.number().int(),
});

const oasisOccupationFormSchema = z
  .strictObject({
    units: z.array(unitSelectionSchema),
    target: targetSchema,
  })
  .refine((data) => data.units.some((u) => u.selected > 0), {
    message: 'At least 1 troop must be selected',
    path: ['units'],
  })
  .refine((data) => data.units.every((u) => u.selected <= u.available), {
    message: 'Selected units cannot exceed available count',
    path: ['units'],
  });

export const OasisOccupationForm = () => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const tribe = useTribe();
  const { getDeployableTroops } = useVillageTroops();
  const { createEvent: createOasisOccupationEvent } = useCreateEvent(
    'troopMovementOasisOccupation',
  );

  const deployableTroops = useMemo(() => {
    return getDeployableTroops();
  }, [getDeployableTroops]);

  const initialUnits = useMemo(() => {
    const tribeUnits = [...getUnitsByTribe(tribe), getUnitDefinition('HERO')];

    return tribeUnits.map((unitDef) => {
      const troop = deployableTroops.find((t) => t.unitId === unitDef.id);

      return {
        unitId: unitDef.id,
        available: troop?.amount ?? 0,
        selected: 0,
        tier: unitDef.tier,
        category: unitDef.category,
      };
    });
  }, [deployableTroops, tribe]);

  const form = useForm({
    resolver: zodResolver(oasisOccupationFormSchema),
    defaultValues: {
      units: initialUnits,
      target: { x: 0, y: 0 },
    },
  });

  useEffect(() => {
    form.reset({
      ...form.getValues(),
      units: initialUnits,
    });
  }, [form, initialUnits]);

  const onFormSubmit = (data: z.infer<typeof oasisOccupationFormSchema>) => {
    const troops = data.units
      .filter((u) => u.selected > 0)
      .map((u) => ({
        unitId: u.unitId,
        amount: u.selected,
        tileId: currentVillage.tileId,
        source: currentVillage.id,
      }));

    const eventArgs = {
      troops,
      coordinates: { x: data.target.x, y: data.target.y },
      cachesToClearImmediately: [villageTroopsCacheKey],
    };

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
