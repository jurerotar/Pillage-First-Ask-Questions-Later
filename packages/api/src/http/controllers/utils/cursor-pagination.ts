import { z } from 'zod';

export const cursorPaginationQuerySchema = z.strictObject({
  cursor: z.string().nullable().optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const createCursorPage = <TItem>({
  items,
  pageSize,
  getCursor,
}: {
  items: TItem[];
  pageSize: number;
  getCursor: (item: TItem) => string;
}) => {
  const pageItems = items.slice(0, pageSize);
  const hasNextPage = items.length > pageSize;
  const lastPageItem = pageItems.at(-1);

  return {
    items: pageItems,
    nextCursor: hasNextPage && lastPageItem ? getCursor(lastPageItem) : null,
  };
};
