import { createContext, type PropsWithChildren } from 'react';

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
  return (
    <VillageSlugContext value={{ villageSlug }}>{children}</VillageSlugContext>
  );
};
