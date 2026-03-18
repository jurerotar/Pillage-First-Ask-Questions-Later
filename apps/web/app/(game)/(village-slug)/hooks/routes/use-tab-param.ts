import { useSearchParams } from 'react-router';

export const useTabParam = (
  tabs: string[],
  queryParam = 'tab',
  defaultValue = 'default',
) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const tabNameToIndex: Record<string, number> = {};

  for (const [index, name] of tabs.entries()) {
    tabNameToIndex[name] = index;
  }

  const tabIndex = tabNameToIndex[searchParams.get(queryParam) ?? defaultValue];

  const navigateToTab = (tab: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set(queryParam, tab);
      return next;
    });
  };

  return {
    tabIndex,
    navigateToTab,
  };
};
