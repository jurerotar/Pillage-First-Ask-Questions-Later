export type Report = {
  id: string;
  title: string;
  description: string;
  contact: string | null;
  createdAt: number;
  closedAt: number | null;
  status: 'open' | 'closed';
  uploadExpiresAt: number | null;
  world: {
    id: string;
    filename: string;
    size: number;
    status: 'pending' | 'complete';
    createdAt: number;
    completedAt: number | null;
    mimeType: string | null;
    downloadUrl: string | null;
  } | null;
};

const apiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '');

export const request = async (
  token: string,
  path: string,
  options: RequestInit = {},
): Promise<Response> => {
  if (!apiUrl) {
    throw new Error('VITE_API_URL must be set in .env.');
  }
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${apiUrl}${path}`, { ...options, headers });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? `Request failed (${response.status}).`);
  }
  return response;
};

export const getReports = async (
  token: string,
  signal?: AbortSignal,
): Promise<Report[]> => {
  const response = await request(token, '/api/admin/reports', { signal });
  const data = (await response.json()) as { reports: Report[] };
  return data.reports;
};

export const getReport = async (
  token: string,
  id: string,
  signal?: AbortSignal,
): Promise<Report> => {
  const response = await request(
    token,
    `/api/admin/reports/${encodeURIComponent(id)}`,
    { signal },
  );
  return response.json();
};

export const formatDate = (value: number | null): string =>
  value === null ? '—' : new Date(value).toLocaleString();
