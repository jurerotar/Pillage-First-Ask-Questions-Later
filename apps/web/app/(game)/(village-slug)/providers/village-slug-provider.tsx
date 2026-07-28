import { type PropsWithChildren, useMemo } from 'react';
import { VillageSlugContext } from 'app/(game)/(village-slug)/providers/village-slug-context';

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
