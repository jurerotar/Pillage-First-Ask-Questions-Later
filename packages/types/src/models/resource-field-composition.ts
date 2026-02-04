import { z } from 'zod';

export const resourceFieldCompositionSchema = z
  .enum([
    '4446',
    '5436',
    '5346',
    '4536',
    '3546',
    '4356',
    '3456',
    '4437',
    '4347',
    '3447',
    '3339',
    '11115',
    '00018',
  ])
  .meta({
    id: 'ResourceFieldComposition',
    description: 'The composition of resource fields in a village.',
    example: '4446',
  });

export type ResourceFieldComposition = z.infer<
  typeof resourceFieldCompositionSchema
>;
