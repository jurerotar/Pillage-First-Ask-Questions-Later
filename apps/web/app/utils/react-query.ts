import type { MutationFunctionContext, QueryKey } from '@tanstack/react-query';

export const invalidateQueries = async (
  context: MutationFunctionContext,
  queriesToInvalidate: QueryKey[],
): Promise<void> => {
  await Promise.all(
    queriesToInvalidate.map((queryKey) => {
      return context.client.invalidateQueries({ queryKey });
    }),
  );
};
