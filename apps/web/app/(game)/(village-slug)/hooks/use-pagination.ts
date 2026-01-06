import { useEffect, useState } from 'react';

export const usePagination = <T>(
  items: T[],
  resultsPerPage: number,
  defaultPage = 1,
) => {
  const [page, setPage] = useState<number>(defaultPage);
  const pageCount = Math.max(1, Math.ceil(items.length / resultsPerPage));

  const isPaginationPreviousEnabled = pageCount >= 2 && page !== 1;
  const isPaginationNextEnabled = pageCount >= 2 && page < pageCount;

  const start = (page - 1) * resultsPerPage;
  const currentPageItems = items.slice(start, start + resultsPerPage);

  const paginationElements: (number | 'ellipsis-left' | 'ellipsis-right')[] =
    [];

  if (pageCount <= 7) {
    for (let i = 1; i <= pageCount; i += 1) {
      paginationElements.push(i);
    }
  } else {
    paginationElements.push(1);
    if (page > 3) {
      paginationElements.push('ellipsis-left');
    }
    const midStart = Math.max(2, page - 1);
    const midEnd = Math.min(pageCount - 1, page + 1);
    for (let i = midStart; i <= midEnd; i += 1) {
      paginationElements.push(i);
    }
    if (page < pageCount - 2) {
      paginationElements.push('ellipsis-right');
    }
    paginationElements.push(pageCount);
  }

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  return {
    page,
    setPage,
    pageCount,
    resultsPerPage,
    paginationElements,
    currentPageItems,
    isPaginationPreviousEnabled,
    isPaginationNextEnabled,
  };
};
