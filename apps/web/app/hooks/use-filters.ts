import { useSearchParams } from 'react-router';

type UseFiltersProps<T extends string> = {
  paramName: string;
  defaultFilters?: T[];
};

export const useFilters = <T extends string>({
  paramName,
  defaultFilters = [],
}: UseFiltersProps<T>) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentFilters = searchParams.getAll(paramName);
  const filters = (
    currentFilters.length > 0 ? currentFilters : defaultFilters
  ) as T[];

  const onFiltersChange = (newFilters: T[]) => {
    setSearchParams((prev) => {
      prev.delete(paramName);
      for (const filter of newFilters) {
        prev.append(paramName, filter);
      }
      prev.set('page', '1');
      return prev;
    });
  };

  const page = Number.parseInt(searchParams.get('page') ?? '1', 10);

  const handlePageChange = (newPage: number | ((prev: number) => number)) => {
    setSearchParams((prev) => {
      const nextP = typeof newPage === 'function' ? newPage(page) : newPage;
      prev.set('page', nextP.toString());
      return prev;
    });
  };

  return {
    filters,
    onFiltersChange,
    page,
    handlePageChange,
  };
};
