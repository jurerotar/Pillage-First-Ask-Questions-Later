import { useEffect, useMemo, useState } from 'react';

export const usePagination = <T>(
  items: T[],
  resultsPerPage: number,
  defaultPage = 1,
) => {
  const [page, setPage] = useState<number>(defaultPage);

  const pageCount = useMemo(() => {
    return Math.max(1, Math.ceil(items.length / resultsPerPage));
  }, [items.length, resultsPerPage]);

  const isPaginationPreviousEnabled = pageCount >= 2 && page !== 1;
  const isPaginationNextEnabled = pageCount >= 2 && page < pageCount;

  const start = (page - 1) * resultsPerPage;

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
      if (page > 3) {
        elements.push('ellipsis-left');
      }
      const midStart = Math.max(2, page - 1);
      const midEnd = Math.min(pageCount - 1, page + 1);
      for (let i = midStart; i <= midEnd; i += 1) {
        elements.push(i);
      }
      if (page < pageCount - 2) {
        elements.push('ellipsis-right');
      }
      elements.push(pageCount);
    }

    return elements;
  }, [page, pageCount]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  return useMemo(
    () => ({
      page,
      setPage,
      pageCount,
      resultsPerPage,
      paginationElements,
      currentPageItems,
      isPaginationPreviousEnabled,
      isPaginationNextEnabled,
    }),
    [
      page,
      pageCount,
      resultsPerPage,
      paginationElements,
      currentPageItems,
      isPaginationPreviousEnabled,
      isPaginationNextEnabled,
    ],
  );
};
