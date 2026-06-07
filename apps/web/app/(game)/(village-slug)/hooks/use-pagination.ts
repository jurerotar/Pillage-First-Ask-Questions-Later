import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

export const usePagination = <T>(
  items: T[],
  resultsPerPage: number,
  defaultPage = 1,
) => {
  const [page, setStoredPage] = useState<number>(defaultPage);

  const pageCount = useMemo(() => {
    return Math.max(1, Math.ceil(items.length / resultsPerPage));
  }, [items.length, resultsPerPage]);

  const clampPage = useCallback(
    (nextPage: number) => {
      return Math.min(pageCount, Math.max(1, nextPage));
    },
    [pageCount],
  );

  const setPage: Dispatch<SetStateAction<number>> = useCallback(
    (nextPage) => {
      setStoredPage((previousPage) => {
        const currentPage = clampPage(previousPage);
        const resolvedPage =
          typeof nextPage === 'function' ? nextPage(currentPage) : nextPage;

        return clampPage(resolvedPage);
      });
    },
    [clampPage],
  );

  const actualPage = clampPage(page);

  const isPaginationPreviousEnabled = pageCount >= 2 && actualPage !== 1;
  const isPaginationNextEnabled = pageCount >= 2 && actualPage < pageCount;

  const start = (actualPage - 1) * resultsPerPage;

  const currentPageItems = useMemo(() => {
    return items.slice(start, start + resultsPerPage);
  }, [items, start, resultsPerPage]);

  const paginationElements = useMemo(() => {
    const elements: (number | 'ellipsis-left' | 'ellipsis-right')[] = [];

    if (pageCount <= 7) {
      for (let i = 1; i <= pageCount; i += 1) {
        elements.push(i);
      }
    } else {
      elements.push(1);
      if (actualPage > 3) {
        elements.push('ellipsis-left');
      }
      const midStart = Math.max(2, actualPage - 1);
      const midEnd = Math.min(pageCount - 1, actualPage + 1);
      for (let i = midStart; i <= midEnd; i += 1) {
        elements.push(i);
      }
      if (actualPage < pageCount - 2) {
        elements.push('ellipsis-right');
      }
      elements.push(pageCount);
    }

    return elements;
  }, [actualPage, pageCount]);

  useEffect(() => {
    setStoredPage(defaultPage);
  }, [defaultPage]);

  return useMemo(
    () => ({
      page: actualPage,
      setPage,
      pageCount,
      resultsPerPage,
      paginationElements,
      currentPageItems,
      isPaginationPreviousEnabled,
      isPaginationNextEnabled,
    }),
    [
      actualPage,
      setPage,
      pageCount,
      resultsPerPage,
      paginationElements,
      currentPageItems,
      isPaginationPreviousEnabled,
      isPaginationNextEnabled,
    ],
  );
};
