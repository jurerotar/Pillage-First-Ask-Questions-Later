import { invalidateCacheKey } from 'database/cache';

export type UseDatabaseMutationParams = {
  cacheKey?: string;
};

export type UseDatabaseMutationParamsReturn = {
  mutate: (mutationFn: () => Promise<void>) => Promise<void>;
};

export const useDatabaseMutation = (
  params: UseDatabaseMutationParams
): UseDatabaseMutationParamsReturn => {
  const {
    cacheKey,
  } = params;

  const mutate = async (mutationFn: () => Promise<void>) => {
    // If cacheKey was provided, invalidate cache for said key
    if (cacheKey) {
      invalidateCacheKey(cacheKey);
    }
    await mutationFn();
  };

  return {
    mutate,
  };
};
