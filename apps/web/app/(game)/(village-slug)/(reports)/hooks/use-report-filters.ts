import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { useSearchParams } from 'react-router';
import type {
  ReportListingFilter,
  ReportScope,
} from '@pillage-first/types/dtos/report';
import {
  reportFilterNameByScope,
  reportFiltersDtoSchema,
} from '@pillage-first/types/dtos/report';
import { useMe } from 'app/(game)/(village-slug)/hooks/use-me';
import {
  filtersCacheKey,
  reportListingsCacheKey,
} from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';
import { invalidateQueries } from 'app/utils/react-query';

export const useReportFilters = (scope: ReportScope) => {
  const { apiClient } = use(ApiContext);
  const { player } = useMe();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterName = reportFilterNameByScope[scope];

  const { data: filters } = useSuspenseQuery({
    queryKey: [filtersCacheKey, filterName],
    queryFn: async () => {
      const { data } = await apiClient.get('/players/:playerId/filters/:name', {
        path: {
          playerId: player.id,
          name: filterName,
        },
      });

      return reportFiltersDtoSchema.parse(data);
    },
  });

  const { mutate: updateReportFilters } = useMutation<
    void,
    Error,
    ReportListingFilter[]
  >({
    mutationFn: async (nextFilters) => {
      await apiClient.patch('/players/:playerId/filters/:name', {
        path: {
          playerId: player.id,
          name: filterName,
        },
        body: {
          filters: nextFilters,
        },
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [
        [filtersCacheKey, filterName],
        [reportListingsCacheKey],
      ]);
    },
  });

  const resetPage = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', '1');
      return next;
    });
  };

  const onFiltersChange = (nextFilters: ReportListingFilter[]) => {
    resetPage();
    updateReportFilters(nextFilters);
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
