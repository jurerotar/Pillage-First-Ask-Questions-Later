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
      const next = new URLSearchParams(prev);
      next.delete(paramName);
      for (const filter of newFilters) {
        next.append(paramName, filter);
      }
      next.set('page', '1');
      return next;
    });
  };

  const page = Number.parseInt(searchParams.get('page') ?? '1', 10);

  const handlePageChange = (newPage: number | ((prev: number) => number)) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      const nextP = typeof newPage === 'function' ? newPage(page) : newPage;
      next.set('page', nextP.toString());
      return next;
    });
  };

  return {
    filters,
    onFiltersChange,
    page,
    handlePageChange,
  };
};
