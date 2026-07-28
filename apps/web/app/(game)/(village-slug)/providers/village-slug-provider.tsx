import { createContext, type PropsWithChildren, useMemo } from 'react';

type VillageSlugContextValue = {
  villageSlug: string;
};

export const VillageSlugContext = createContext<VillageSlugContextValue>(
  {} as never,
);

type VillageSlugProviderProps = PropsWithChildren<{
  villageSlug: string;
}>;

export const VillageSlugProvider = ({
  children,
  villageSlug,
}: VillageSlugProviderProps) => {
  const value = useMemo(() => {
    return {
      villageSlug,
    };
  }, [villageSlug]);

  return <VillageSlugContext value={value}>{children}</VillageSlugContext>;
};
