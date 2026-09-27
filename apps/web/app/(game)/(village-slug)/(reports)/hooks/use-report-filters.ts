import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { use } from 'react';
import { useSearchParams } from 'react-router';
import {
  type ReportListingFilter,
  reportListingFilterSchema,
} from '@pillage-first/types/dtos/report';
import { useMe } from 'app/(game)/(village-slug)/hooks/use-me';
import {
  reportFiltersCacheKey,
  reportListingsCacheKey,
} from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';
import { invalidateQueries } from 'app/utils/react-query';

export const useReportFilters = () => {
  const { apiClient } = use(ApiContext);
  const { player } = useMe();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: filters } = useSuspenseQuery({
    queryKey: [reportFiltersCacheKey],
    queryFn: async () => {
      const { data } = await apiClient.get(
        '/players/:playerId/report-filters',
        {
          path: {
            playerId: player.id,
          },
        },
      );

      return data;
    },
  });

  const { mutate: updateReportFilters } = useMutation<
    void,
    Error,
    ReportListingFilter[]
  >({
    mutationFn: async (nextFilters) => {
      await apiClient.patch('/players/:playerId/report-filters', {
        path: {
          playerId: player.id,
        },
        body: {
          filters: nextFilters,
        },
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [
        [reportFiltersCacheKey],
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

  const invertReportFilters = () => {
    const activeFilters = new Set(filters);
    onFiltersChange(
      reportListingFilterSchema.options.filter(
        (filter) => !activeFilters.has(filter),
      ),
    );
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
    invertReportFilters,
    page,
    handlePageChange,
  };
};
