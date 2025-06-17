import { useSearchParams } from 'react-router';

export const useTabParam = (tabs: string[]) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const tabNameToIndex: Record<string, number> = tabs.reduce<
    Record<string, number>
  >((acc, name, idx) => {
    acc[name] = idx;
    return acc;
  }, {});

  const tabIndex = tabNameToIndex[searchParams.get('tab') ?? 'default'];

  const navigateToTab = (tab: string) => {
    setSearchParams({ tab });
  };

  return {
    tabIndex,
    navigateToTab,
  };
};
