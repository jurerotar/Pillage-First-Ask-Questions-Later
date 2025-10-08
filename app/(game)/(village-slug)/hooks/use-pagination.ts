import { useEffect, useState } from 'react';

export const usePagination = <T>(items: T[], limit: number) => {
  const [page, setPage] = useState<number>(1);
  const pageCount = Math.max(1, Math.ceil(items.length / limit));

  const isPaginationPreviousEnabled = pageCount >= 2 && page !== 1;
  const isPaginationNextEnabled = pageCount >= 2 && page < pageCount;

  const start = (page - 1) * limit;
  const currentPageItems = items.slice(start, start + limit);

  const paginationElements: (number | 'ellipsis-left' | 'ellipsis-right')[] =
    [];

  if (pageCount <= 7) {
    for (let i = 1; i <= pageCount; i++) {
      paginationElements.push(i);
    }
  } else {
    paginationElements.push(1);
    if (page > 3) {
      paginationElements.push('ellipsis-left');
    }
    const midStart = Math.max(2, page - 1);
    const midEnd = Math.min(pageCount - 1, page + 1);
    for (let i = midStart; i <= midEnd; i++) {
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
    paginationElements,
    currentPageItems,
    isPaginationPreviousEnabled,
    isPaginationNextEnabled,
  };
};
