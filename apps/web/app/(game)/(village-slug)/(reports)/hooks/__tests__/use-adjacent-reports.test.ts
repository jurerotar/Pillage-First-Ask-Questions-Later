// @vitest-environment happy-dom

import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { ReportListingDto } from '@pillage-first/types/dtos/report';
import * as useReportsModule from 'app/(game)/(village-slug)/hooks/use-reports';
import { useAdjacentReports } from '../use-adjacent-reports';

const makeReport = (id: number, timestamp: number): ReportListingDto => ({
  id,
  villageId: 1,
  timestamp,
  type: 'battle',
  outcome: 'attackerNoLoss',
  tags: [],
  summary: {
    originName: 'Origin',
    originCoordinates: { x: 0, y: 0 },
    targetName: 'Target',
    targetCoordinates: { x: 1, y: 1 },
    movementType: 'raid',
  },
});

describe(useAdjacentReports, () => {
  const useReportsSpy = vi.spyOn(useReportsModule, 'useReports');

  beforeEach(() => {
    useReportsSpy.mockReturnValue({
      reports: [makeReport(3, 300), makeReport(2, 200), makeReport(1, 100)],
      updateReports: vi.fn(),
      deleteReports: vi.fn(),
    });
  });

  test('returns previous (newer) and next (older) report ids', () => {
    const { result } = renderHook(() =>
      useAdjacentReports(2, new URLSearchParams()),
    );

    expect(result.current.previousReportId).toBe(3);
    expect(result.current.nextReportId).toBe(1);
  });

  test('returns null for previous when viewing the newest report', () => {
    const { result } = renderHook(() =>
      useAdjacentReports(3, new URLSearchParams()),
    );

    expect(result.current.previousReportId).toBeNull();
    expect(result.current.nextReportId).toBe(2);
  });

  test('returns null for next when viewing the oldest report', () => {
    const { result } = renderHook(() =>
      useAdjacentReports(1, new URLSearchParams()),
    );

    expect(result.current.previousReportId).toBe(2);
    expect(result.current.nextReportId).toBeNull();
  });

  test('returns nulls for report not in the list', () => {
    const { result } = renderHook(() =>
      useAdjacentReports(99, new URLSearchParams()),
    );

    expect(result.current.previousReportId).toBeNull();
    expect(result.current.nextReportId).toBeNull();
  });

  test('extracts scope from reports-tab search param', () => {
    renderHook(() =>
      useAdjacentReports(2, new URLSearchParams([['reports-tab', 'unread']])),
    );

    expect(useReportsSpy).toHaveBeenCalledWith('unread', []);
  });

  test('defaults scope to global when tab is missing or invalid', () => {
    renderHook(() => useAdjacentReports(2, new URLSearchParams()));

    expect(useReportsSpy).toHaveBeenCalledWith('global', []);
  });

  test('extracts filters from scope search params', () => {
    renderHook(() =>
      useAdjacentReports(
        2,
        new URLSearchParams([
          ['scope', 'battle'],
          ['scope', 'scouting'],
        ]),
      ),
    );

    expect(useReportsSpy).toHaveBeenCalledWith('global', [
      'battle',
      'scouting',
    ]);
  });
});
