import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import {
  getUnitDefinition,
  getUnitsByTribe,
} from '@pillage-first/game-assets/utils/units';
import { unitIdSchema, unitTierSchema } from '@pillage-first/types/models/unit';
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
import { CoordinateSelector } from './components/target-selectors.tsx';
import { UnitSelector } from './components/unit-selector.tsx';

const unitSelectionSchema = z.strictObject({
  unitId: unitIdSchema,
  selected: z.coerce.number().int().nonnegative().default(0),
  available: z.number().int().nonnegative(),
  tier: unitTierSchema,
  category: z.string(),
});

const targetSchema = z.strictObject({
  x: z.coerce.number().int(),
  y: z.coerce.number().int(),
});

const foundNewVillageFormSchema = z
  .strictObject({
    units: z.array(unitSelectionSchema),
    target: targetSchema,
  })
  .refine(
    (data) => {
      const selectedUnits = data.units.filter((u) => u.selected > 0);
      return (
        selectedUnits.length > 0 &&
        selectedUnits.every((u) => u.tier === 'settler')
      );
    },
    {
      message: 'Only settlers can be sent to found a new village',
      path: ['units'],
    },
  )
  .refine(
    (data) => {
      const totalSettlers = data.units
        .filter((u) => u.tier === 'settler')
        .reduce((sum, u) => sum + u.selected, 0);
      return totalSettlers === 3;
    },
    {
      message: 'Exactly 3 settlers are required to found a new village',
      path: ['units'],
    },
  )
  .refine((data) => data.units.every((u) => u.selected <= u.available), {
    message: 'Selected units cannot exceed available count',
    path: ['units'],
  });

type FoundNewVillageFormData = z.infer<typeof foundNewVillageFormSchema>;

export const FoundNewVillageForm = () => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const tribe = useTribe();
  const { getDeployableTroops } = useVillageTroops();
  const { createEvent: createFindNewVillageEvent } = useCreateEvent(
    'troopMovementFindNewVillage',
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

  const form = useForm<FoundNewVillageFormData>({
    resolver: zodResolver(foundNewVillageFormSchema) as any,
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

  const onFormSubmit = (data: FoundNewVillageFormData) => {
    const { units, target } = data;
    const troops = units
      .filter((u) => u.selected > 0)
      .map((u) => ({
        unitId: u.unitId,
        amount: u.selected,
        tileId: currentVillage.tileId,
        source: currentVillage.id,
      }));

    const eventArgs = {
      troops,
      coordinates: { x: target.x, y: target.y },
      cachesToClearImmediately: [villageTroopsCacheKey],
    };

    createFindNewVillageEvent(eventArgs);
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
            />

            <div className="flex items-end gap-8">
              <CoordinateSelector />
            </div>

            <ErrorBag
              errorBag={Object.entries(form.formState.errors).flatMap(
                ([_, error]) => {
                  if (!error) {
                    return [];
                  }
                  if ('message' in error && error.message) {
                    return [error.message.toString()];
                  }
                  return Object.values(error)
                    .map((nested) =>
                      nested && 'message' in nested
                        ? nested.message?.toString()
                        : undefined,
                    )
                    .filter((m): m is string => !!m);
                },
              )}
            />

            <Button type="submit">{t('Confirm')}</Button>
          </form>
        </Form>
      </SectionContent>
    </Section>
  );
};
