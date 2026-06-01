import { z } from 'zod';

export const cursorPaginatedResponseSchema = <TItemSchema extends z.ZodType>(
  itemSchema: TItemSchema,
) =>
  z
    .strictObject({
      items: z.array(itemSchema),
      nextCursor: z.string().nullable(),
    })
    .meta({ id: 'CursorPaginatedResponseDto' });
