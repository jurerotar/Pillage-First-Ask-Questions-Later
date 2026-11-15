import type { ReportScope } from '@pillage-first/types/dtos/report';

export const reportTabs = [
  'global',
  'unread',
  'archived',
  'village',
] as const satisfies ReportScope[];
