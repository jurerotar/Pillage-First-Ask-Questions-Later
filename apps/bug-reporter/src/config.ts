import { isAbsolute, relative, resolve } from 'node:path';

const minimumSecretLength = 32;

export type AppConfig = {
  adminAllowedOrigin?: string;
  adminApiToken: string;
  allowedOrigin?: string;
  appDirectory: string;
  dataDirectory: string;
  maxChunkBytes: number;
  maxFileBytes: number;
  maxReportBytes: number;
  publicBaseUrl: string;
  uploadLinkTtlMinutes: number;
  uploadUrlSecret: string;
};

const getRequiredEnvironmentVariable = (name: string): string => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} must be set.`);
  }

  return value;
};

const getPositiveInteger = (name: string, fallback: number): number => {
  const value = process.env[name];

  if (value === undefined) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error(`${name} must be a non-negative integer.`);
  }

  return parsed;
};

const isPathInside = (parent: string, child: string): boolean => {
  const path = relative(parent, child);
  return path === '' || (!path.startsWith('..') && !isAbsolute(path));
};

export const getConfig = (): AppConfig => {
  const appDirectory = resolve(process.cwd());
  const dataDirectory = resolve(
    getRequiredEnvironmentVariable('APP_DATA_DIRECTORY'),
  );

  if (isPathInside(appDirectory, dataDirectory)) {
    throw new Error(
      'APP_DATA_DIRECTORY must be outside the application release directory.',
    );
  }

  const publicBaseUrl = getRequiredEnvironmentVariable('PUBLIC_BASE_URL');

  try {
    new URL(publicBaseUrl);
  } catch {
    throw new Error('PUBLIC_BASE_URL must be an absolute URL.');
  }

  const uploadUrlSecret = getRequiredEnvironmentVariable('UPLOAD_URL_SECRET');
  const adminApiToken = getRequiredEnvironmentVariable('ADMIN_API_TOKEN');

  if (uploadUrlSecret.length < minimumSecretLength) {
    throw new Error('UPLOAD_URL_SECRET must be at least 32 characters long.');
  }

  if (adminApiToken.length < minimumSecretLength) {
    throw new Error('ADMIN_API_TOKEN must be at least 32 characters long.');
  }

  const maxFileBytes = getPositiveInteger('MAX_FILE_BYTES', 250 * 1024 * 1024);
  const maxReportBytes = getPositiveInteger(
    'MAX_REPORT_BYTES',
    250 * 1024 * 1024,
  );
  const maxChunkBytes = getPositiveInteger('MAX_CHUNK_BYTES', 8 * 1024 * 1024);

  if (
    maxFileBytes === 0 ||
    maxReportBytes === 0 ||
    maxChunkBytes === 0 ||
    maxChunkBytes > maxFileBytes ||
    maxFileBytes > maxReportBytes
  ) {
    throw new Error(
      'Upload limits must be positive and internally consistent.',
    );
  }

  return {
    adminAllowedOrigin: process.env.ADMIN_ALLOWED_ORIGIN?.trim() || undefined,
    adminApiToken,
    allowedOrigin: process.env.ALLOWED_ORIGIN?.trim() || undefined,
    appDirectory,
    dataDirectory,
    maxChunkBytes,
    maxFileBytes,
    maxReportBytes,
    publicBaseUrl: new URL(publicBaseUrl).toString(),
    uploadLinkTtlMinutes: getPositiveInteger(
      'UPLOAD_LINK_TTL_MINUTES',
      24 * 60,
    ),
    uploadUrlSecret,
  };
};
