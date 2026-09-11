// @vitest-environment happy-dom

import { renderHook } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import type { ReportListingDto } from '@pillage-first/types/dtos/report';
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
  const reports = [makeReport(3, 300), makeReport(2, 200), makeReport(1, 100)];

  test('returns previous (newer) and next (older) report ids', () => {
    const { result } = renderHook(() => useAdjacentReports(2, reports));

    expect(result.current.previousReportId).toBe(3);
    expect(result.current.nextReportId).toBe(1);
  });

  test('returns null for previous when viewing the newest report', () => {
    const { result } = renderHook(() => useAdjacentReports(3, reports));

    expect(result.current.previousReportId).toBeNull();
    expect(result.current.nextReportId).toBe(2);
  });

  test('returns null for next when viewing the oldest report', () => {
    const { result } = renderHook(() => useAdjacentReports(1, reports));

    expect(result.current.previousReportId).toBe(2);
    expect(result.current.nextReportId).toBeNull();
  });

  test('returns nulls for report not in the list', () => {
    const { result } = renderHook(() => useAdjacentReports(99, reports));

    expect(result.current.previousReportId).toBeNull();
    expect(result.current.nextReportId).toBeNull();
  });

  test('uses the provided filtered report list', () => {
    const { result } = renderHook(() =>
      useAdjacentReports(2, [makeReport(4, 400), makeReport(2, 200)]),
    );

    expect(result.current.previousReportId).toBe(4);
    expect(result.current.nextReportId).toBeNull();
  });
});
