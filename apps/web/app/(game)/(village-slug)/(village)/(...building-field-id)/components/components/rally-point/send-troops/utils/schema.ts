import { z } from 'zod';
import {
  unitCategorySchema,
  unitIdSchema,
  unitTierSchema,
} from '@pillage-first/types/models/unit';

export const unitSelectionSchema = z.object({
  unitId: unitIdSchema,
  selected: z.coerce.number().int().nonnegative().default(0),
  available: z.number().int().nonnegative(),
  tier: unitTierSchema,
  category: unitCategorySchema,
});

export const targetSchema = z.strictObject({
  x: z.coerce
    .number({ error: 'X coordinate is required' })
    .int({ error: 'X must be an integer' }),
  y: z.coerce
    .number({ error: 'Y coordinate is required' })
    .int({ error: 'Y must be an integer' }),
});

export const troopFormRefinementOptions = [
  {
    check: (data: { units: { selected: number; available: number }[] }) =>
      data.units.some((u) => u.selected > 0),
    message: 'At least 1 troop must be selected',
    path: ['units'],
  },
  {
    check: (data: { units: { selected: number; available: number }[] }) =>
      data.units.every((u) => u.selected <= u.available),
    message: 'Selected units cannot exceed available count',
    path: ['units'],
  },
];

export const baseTroopFormSchema = z
  .strictObject({
    units: z.array(unitSelectionSchema),
    target: targetSchema,
  })
  .refine(troopFormRefinementOptions[0].check, troopFormRefinementOptions[0])
  .refine(troopFormRefinementOptions[1].check, troopFormRefinementOptions[1]);

export const foundNewVillageFormSchema = baseTroopFormSchema
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
  );

export type UnitSelection = z.infer<typeof unitSelectionSchema>;
export type BaseTroopFormValues = z.infer<typeof baseTroopFormSchema>;
