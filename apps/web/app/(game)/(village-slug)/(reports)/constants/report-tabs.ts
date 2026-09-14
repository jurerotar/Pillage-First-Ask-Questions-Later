import type { ReportScope } from 'app/(game)/(village-slug)/hooks/use-reports';

export const reportTabs = [
  'global',
  'unread',
  'archived',
  'village',
] as const satisfies ReportScope[];
