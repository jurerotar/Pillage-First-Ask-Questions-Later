import { type QueryKey, useSuspenseQuery } from '@tanstack/react-query';
import {
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
};

export type CursorPaginationOptions<T> = {
  queryKey: QueryKey;
  resultsPerPage: number;
  defaultPage?: number;
  queryFn: (args: {
    cursor: string | null;
    pageSize: number;
  }) => Promise<CursorPage<T>>;
};

const buildPaginationElements = (actualPage: number, pageCount: number) => {
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
};

export const usePagination = <T>(
  items: T[],
  resultsPerPage: number,
  defaultPage = 1,
) => {
  const [page, setPage] = useState<number>(defaultPage);

  const pageCount = useMemo(() => {
    return Math.max(1, Math.ceil(items.length / resultsPerPage));
  }, [items.length, resultsPerPage]);

  const actualPage = page > pageCount ? pageCount : page;

  const isPaginationPreviousEnabled = pageCount >= 2 && actualPage !== 1;
  const isPaginationNextEnabled = pageCount >= 2 && actualPage < pageCount;

  const start = (actualPage - 1) * resultsPerPage;

  const currentPageItems = useMemo(() => {
    return items.slice(start, start + resultsPerPage);
  }, [items, start, resultsPerPage]);

  const paginationElements = useMemo(() => {
    return buildPaginationElements(actualPage, pageCount);
  }, [actualPage, pageCount]);

  useEffect(() => {
    setPage(defaultPage);
  }, [defaultPage]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [pageCount, page]);

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
      pageCount,
      resultsPerPage,
      paginationElements,
      currentPageItems,
      isPaginationPreviousEnabled,
      isPaginationNextEnabled,
    ],
  );
};

export const useCursorPagination = <T>({
  queryKey,
  resultsPerPage,
  defaultPage = 1,
  queryFn,
}: CursorPaginationOptions<T>) => {
  const paginationKey = JSON.stringify(queryKey);
  const [page, setPageState] = useState<number>(defaultPage);
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([null]);

  const actualPage = Math.min(Math.max(1, page), cursorHistory.length);
  const cursor = cursorHistory[actualPage - 1] ?? null;

  const { data } = useSuspenseQuery({
    queryKey: [...queryKey, cursor, resultsPerPage],
    queryFn: () =>
      queryFn({
        cursor,
        pageSize: resultsPerPage,
      }),
  });

  const pageCount = data.nextCursor ? actualPage + 1 : actualPage;
  const isPaginationPreviousEnabled = actualPage > 1;
  const isPaginationNextEnabled = data.nextCursor !== null;

  const paginationElements = useMemo(() => {
    return buildPaginationElements(actualPage, pageCount);
  }, [actualPage, pageCount]);

  const setPage = useCallback(
    (value: SetStateAction<number>) => {
      setPageState((previousPage) => {
        const nextPage =
          typeof value === 'function' ? value(previousPage) : value;

        if (nextPage < 1) {
          return 1;
        }

        if (nextPage === previousPage + 1 && data.nextCursor) {
          setCursorHistory((previousCursorHistory) => {
            if (previousCursorHistory[nextPage - 1] === data.nextCursor) {
              return previousCursorHistory;
            }

            return [
              ...previousCursorHistory.slice(0, nextPage - 1),
              data.nextCursor,
            ];
          });
          return nextPage;
        }

        if (nextPage <= cursorHistory.length) {
          return nextPage;
        }

        return previousPage;
      });
    },
    [cursorHistory.length, data.nextCursor],
  );

  useEffect(() => {
    // paginationKey intentionally resets the cursor stack when the query changes.
    void paginationKey;
    setPageState(defaultPage);
    setCursorHistory([null]);
  }, [defaultPage, paginationKey]);

  return useMemo(
    () => ({
      page: actualPage,
      setPage,
      pageCount,
      resultsPerPage,
      paginationElements,
      currentPageItems: data.items,
      isPaginationPreviousEnabled,
      isPaginationNextEnabled,
    }),
    [
      actualPage,
      pageCount,
      resultsPerPage,
      paginationElements,
      data.items,
      isPaginationPreviousEnabled,
      isPaginationNextEnabled,
      setPage,
    ],
  );
};
