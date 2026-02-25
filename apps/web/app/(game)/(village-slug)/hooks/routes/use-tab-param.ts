import { useSearchParams } from 'react-router';

export const useTabParam = (tabs: string[]) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const tabNameToIndex: Record<string, number> = {};

  for (const [index, name] of tabs.entries()) {
    tabNameToIndex[name] = index;
  }

  const tabIndex = tabNameToIndex[searchParams.get('tab') ?? 'default'];

  const navigateToTab = (tab: string) => {
    setSearchParams({ tab }, { preventScrollReset: true });
  };

  return {
    tabIndex,
    navigateToTab,
  };
};
