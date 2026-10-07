import { createReadStream } from 'node:fs';
import { open, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { AppConfig } from './config.ts';
import {
  createRandomToken,
  createSignature,
  hashToken,
  isSignatureValid,
  isTokenValid,
} from './crypto.ts';
import type { Report, Store, Upload } from './store.ts';

const oneHour = 60 * 60 * 1000;
const signedUrlLifetimeMs = 15 * 60 * 1000;
const sqliteSignature = Buffer.from('SQLite format 3\u0000', 'ascii');

type CreateAppOptions = {
  config: AppConfig;
  store: Store;
};

type ErrorBody = { error: string };

const error = (message: string): ErrorBody => ({ error: message });

const getClientIp = (request: Request): string =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

const getBearerToken = (request: Request): string | undefined => {
  const authorization = request.headers.get('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    return undefined;
  }

  return authorization.slice('Bearer '.length).trim() || undefined;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getString = (
  body: Record<string, unknown>,
  key: string,
  maximumLength: number,
  required = true,
): string | undefined => {
  const value = body[key];

  if (value === undefined && !required) {
    return undefined;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= maximumLength
    ? trimmed
    : undefined;
};

const getPositiveSafeInteger = (
  body: Record<string, unknown>,
  key: string,
): number | undefined => {
  const value = body[key];
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
    ? value
    : undefined;
};

const isSqliteFile = (contents: Buffer): boolean =>
  contents.length >= sqliteSignature.length &&
  contents.subarray(0, sqliteSignature.length).equals(sqliteSignature);

const getUploadPaths = (config: AppConfig, upload: Upload) => ({
  completed: join(config.dataDirectory, 'uploads', upload.storageName),
  staging: join(config.dataDirectory, 'staging', `${upload.id}.part`),
});

const signedValue = (uploadId: string, expiresAt: number): string =>
  `upload:${uploadId}:${expiresAt}`;

const chunkIndexPlaceholder = 'chunk-index-placeholder';

const getSignedUrls = (config: AppConfig, report: Report, upload: Upload) => {
  const now = Date.now();
  const reportExpiration = report.uploadExpiresAt ?? Number.MAX_SAFE_INTEGER;
  const expiresAt = Math.min(now + signedUrlLifetimeMs, reportExpiration);
  const signature = createSignature(
    config.uploadUrlSecret,
    signedValue(upload.id, expiresAt),
  );
  const createUrl = (pathname: string): string => {
    const url = new URL(pathname, config.publicBaseUrl);
    url.searchParams.set('expires', String(expiresAt));
    url.searchParams.set('signature', signature);
    return url.toString();
  };

  return {
    chunkUrlTemplate: createUrl(
      `/api/uploads/${upload.id}/chunks/${chunkIndexPlaceholder}`,
    ).replace(chunkIndexPlaceholder, '{chunkIndex}'),
    completeUrl: createUrl(`/api/uploads/${upload.id}/complete`),
    expiresAt: new Date(expiresAt).toISOString(),
  };
};

const parseContentRange = (
  header: string | undefined,
): { end: number; start: number; total: number } | undefined => {
  if (!header) {
    return undefined;
  }

  const match = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(header);

  if (!match) {
    return undefined;
  }

  const [start, end, total] = match.slice(1).map(Number);
  return Number.isSafeInteger(start) &&
    Number.isSafeInteger(end) &&
    Number.isSafeInteger(total) &&
    end >= start
    ? { end, start, total }
    : undefined;
};

export const createApp = ({ config, store }: CreateAppOptions): Hono => {
  const app = new Hono();

  app.use('*', async (context, next) => {
    context.header('Cache-Control', 'no-store');
    context.header('X-Content-Type-Options', 'nosniff');
    context.header('X-Frame-Options', 'DENY');
    context.header('Referrer-Policy', 'no-referrer');
    await next();
  });

  const allowedOrigins = [
    config.allowedOrigin,
    config.adminAllowedOrigin,
  ].filter((origin): origin is string => Boolean(origin));
  if (allowedOrigins.length > 0) {
    app.use(
      '/api/*',
      cors({
        allowHeaders: ['Authorization', 'Content-Range', 'Content-Type'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        origin: allowedOrigins,
      }),
    );
  }

  app.use('/api/admin/*', async (context, next) => {
    const token = getBearerToken(context.req.raw);
    if (!token || !isTokenValid(config.adminApiToken, token)) {
      return context.json(error('Unauthorized.'), 401);
    }
    await next();
    return undefined;
  });

  // Keep deletion and upload writes for the same report from overlapping.
  const reportLocks = new Map<string, Promise<void>>();
  app.use('/api/*', async (context, next) => {
    const path = context.req.path;
    const reportMatch = /^\/api\/(?:admin\/)?reports\/([^/]+)/.exec(path);
    const uploadMatch = /^\/api\/uploads\/([^/]+)/.exec(path);
    const reportId =
      reportMatch?.[1] ??
      (uploadMatch ? store.getUpload(uploadMatch[1])?.reportId : undefined);
    if (!reportId || context.req.method === 'GET') {
      await next();
      return;
    }
    const previous = reportLocks.get(reportId) ?? Promise.resolve();
    let release = () => {};
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    reportLocks.set(reportId, current);
    await previous;
    try {
      await next();
    } finally {
      release();
      if (reportLocks.get(reportId) === current) {
        reportLocks.delete(reportId);
      }
    }
  });

  const isRateLimited = (request: Request, scope: string, maximum: number) =>
    !store.consumeRateLimit(
      `${scope}:${getClientIp(request)}`,
      maximum,
      oneHour,
    );

  const getAuthorizedReport = (request: Request, reportId: string) => {
    const token = getBearerToken(request);
    const report = store.getReport(reportId);

    if (
      !token ||
      !report ||
      !isTokenValid(report.writeTokenHash, hashToken(token))
    ) {
      return undefined;
    }

    if (report.uploadExpiresAt && report.uploadExpiresAt <= Date.now()) {
      return undefined;
    }

    return report;
  };

  const getSignedUpload = (
    request: Request,
    uploadId: string,
  ): Upload | undefined => {
    const upload = store.getUpload(uploadId);
    const expires = Number(request.url.match(/[?&]expires=(\d+)/)?.[1]);
    const signature = new URL(request.url).searchParams.get('signature');

    if (
      !upload ||
      !Number.isSafeInteger(expires) ||
      expires < Date.now() ||
      !signature ||
      !isSignatureValid(
        config.uploadUrlSecret,
        signedValue(uploadId, expires),
        signature,
      )
    ) {
      return undefined;
    }

    return upload;
  };

  app.get('/health', (context) => context.json({ status: 'ok' }));

  app.post('/api/reports', async (context) => {
    if (isRateLimited(context.req.raw, 'report', 5)) {
      return context.json(error('Too many reports from this address.'), 429);
    }

    let body: unknown;
    try {
      body = await context.req.json();
    } catch {
      return context.json(error('Request body must be JSON.'), 400);
    }

    if (!isRecord(body)) {
      return context.json(error('Request body must be an object.'), 400);
    }

    const title = getString(body, 'title', 200);
    const description = getString(body, 'description', 10_000);
    const contact = getString(body, 'contact', 320, false);

    if (!title || !description || (body.contact !== undefined && !contact)) {
      return context.json(error('Invalid report details.'), 400);
    }

    const writeToken = createRandomToken();
    const expiresAt =
      config.uploadLinkTtlMinutes === 0
        ? null
        : Date.now() + config.uploadLinkTtlMinutes * 60 * 1000;
    const report = store.createReport({
      contact: contact ?? null,
      description,
      title,
      uploadExpiresAt: expiresAt,
      writeTokenHash: hashToken(writeToken),
    });

    return context.json(
      {
        reportId: report.id,
        uploadExpiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        writeToken,
      },
      201,
    );
  });

  app.post('/api/reports/:reportId/world', async (context) => {
    const report = getAuthorizedReport(
      context.req.raw,
      context.req.param('reportId'),
    );

    if (!report) {
      return context.json(error('Invalid or expired report capability.'), 401);
    }

    let body: unknown;
    try {
      body = await context.req.json();
    } catch {
      return context.json(error('Request body must be JSON.'), 400);
    }

    if (!isRecord(body)) {
      return context.json(error('Request body must be an object.'), 400);
    }

    const originalName = getString(body, 'filename', 255);
    const size = getPositiveSafeInteger(body, 'size');

    if (!originalName || !size) {
      return context.json(error('filename and size are required.'), 400);
    }

    if (size > config.maxFileBytes) {
      return context.json(
        error('The world file exceeds the per-file limit.'),
        413,
      );
    }

    if (store.getReservedBytes(report.id) + size > config.maxReportBytes) {
      return context.json(
        error('The report exceeds its total upload limit.'),
        413,
      );
    }

    const upload = store.createUpload({
      expectedBytes: size,
      originalName,
      reportId: report.id,
    });

    if (!upload) {
      return context.json(
        error('A world file has already been created for this report.'),
        409,
      );
    }

    try {
      await (await open(getUploadPaths(config, upload).staging, 'wx')).close();
    } catch {
      return context.json(error('Unable to reserve upload storage.'), 500);
    }

    return context.json(
      {
        chunkSize: config.maxChunkBytes,
        uploadId: upload.id,
        ...getSignedUrls(config, report, upload),
      },
      201,
    );
  });

  app.post('/api/reports/:reportId/world/upload-url', (context) => {
    const report = getAuthorizedReport(
      context.req.raw,
      context.req.param('reportId'),
    );

    if (!report) {
      return context.json(error('Invalid or expired report capability.'), 401);
    }

    const upload = store.getUploadForReport(report.id);

    if (upload?.status !== 'pending') {
      return context.json(error('A pending world upload was not found.'), 404);
    }

    return context.json({
      chunkSize: config.maxChunkBytes,
      uploadId: upload.id,
      ...getSignedUrls(config, report, upload),
    });
  });

  app.put('/api/uploads/:uploadId/chunks/:chunkIndex', async (context) => {
    if (isRateLimited(context.req.raw, 'upload', 60)) {
      return context.json(
        error('Too many upload requests from this address.'),
        429,
      );
    }

    const upload = getSignedUpload(
      context.req.raw,
      context.req.param('uploadId'),
    );
    const chunkIndex = Number(context.req.param('chunkIndex'));
    const contentLength = Number(context.req.header('content-length'));
    const range = parseContentRange(context.req.header('content-range'));

    if (
      upload?.status !== 'pending' ||
      !Number.isSafeInteger(chunkIndex) ||
      chunkIndex < 0
    ) {
      return context.json(error('Invalid upload URL.'), 401);
    }

    if (
      !Number.isSafeInteger(contentLength) ||
      contentLength <= 0 ||
      contentLength > config.maxChunkBytes ||
      !range ||
      range.total !== upload.expectedBytes
    ) {
      return context.json(error('Invalid upload chunk headers.'), 400);
    }

    const expectedStart = chunkIndex * config.maxChunkBytes;
    const expectedBytes = Math.min(
      config.maxChunkBytes,
      upload.expectedBytes - expectedStart,
    );

    if (
      expectedBytes <= 0 ||
      range.start !== expectedStart ||
      range.end - range.start + 1 !== expectedBytes ||
      contentLength !== expectedBytes
    ) {
      return context.json(error('Unexpected chunk range.'), 400);
    }

    if (store.hasChunk(upload.id, chunkIndex)) {
      return context.body(null, 204);
    }

    const contents = Buffer.from(await context.req.arrayBuffer());

    if (contents.length !== expectedBytes) {
      return context.json(
        error('Chunk size did not match Content-Range.'),
        400,
      );
    }

    try {
      const file = await open(getUploadPaths(config, upload).staging, 'r+');
      await file.write(contents, 0, contents.length, expectedStart);
      await file.close();
      store.addChunk(upload.id, chunkIndex, contents.length);
    } catch (uploadError) {
      console.error('Unable to store upload chunk', uploadError);
      return context.json(error('Unable to store upload chunk.'), 500);
    }

    return context.body(null, 204);
  });

  app.post('/api/uploads/:uploadId/complete', async (context) => {
    if (isRateLimited(context.req.raw, 'upload', 60)) {
      return context.json(
        error('Too many upload requests from this address.'),
        429,
      );
    }

    const upload = getSignedUpload(
      context.req.raw,
      context.req.param('uploadId'),
    );

    if (upload?.status !== 'pending') {
      return context.json(error('Invalid upload URL.'), 401);
    }

    const chunks = store.getChunks(upload.id);
    const expectedChunkCount = Math.ceil(
      upload.expectedBytes / config.maxChunkBytes,
    );

    let totalChunkBytes = 0;
    for (const chunk of chunks) {
      totalChunkBytes += chunk.bytes;
    }

    if (
      chunks.length !== expectedChunkCount ||
      chunks.some((chunk, index) => chunk.chunk_index !== index) ||
      totalChunkBytes !== upload.expectedBytes
    ) {
      return context.json(error('Upload is incomplete.'), 409);
    }

    const paths = getUploadPaths(config, upload);
    try {
      const file = await open(paths.staging, 'r');
      const header = Buffer.alloc(sqliteSignature.length);
      await file.read(header, 0, header.length, 0);
      await file.close();

      if (!isSqliteFile(header)) {
        await rm(paths.staging, { force: true });
        return context.json(
          error('The uploaded file is not a SQLite 3 database.'),
          415,
        );
      }

      await rename(paths.staging, paths.completed);
      store.completeUpload(upload.id, 'application/vnd.sqlite3');
    } catch (uploadError) {
      console.error('Unable to finalize uploaded world', uploadError);
      return context.json(error('Unable to finalize uploaded world.'), 500);
    }

    return context.json({ status: 'complete' });
  });

  const getAdminReport = (report: Report) => {
    const upload = store.getUploadForReport(report.id);
    return {
      id: report.id,
      title: report.title,
      description: report.description,
      contact: report.contact,
      createdAt: report.createdAt,
      closedAt: report.closedAt,
      status: report.closedAt === null ? 'open' : 'closed',
      uploadExpiresAt: report.uploadExpiresAt,
      world: upload
        ? {
            id: upload.id,
            filename: upload.originalName,
            size: upload.expectedBytes,
            status: upload.status,
            createdAt: upload.createdAt,
            completedAt: upload.completedAt,
            mimeType: upload.detectedMime,
            downloadUrl:
              upload.status === 'complete'
                ? `/api/admin/reports/${report.id}/world`
                : null,
          }
        : null,
    };
  };

  app.get('/api/admin/reports', (context) =>
    context.json({ reports: store.listReports().map(getAdminReport) }),
  );

  app.get('/api/admin/reports/:reportId', (context) => {
    const report = store.getReport(context.req.param('reportId'));
    return report
      ? context.json(getAdminReport(report))
      : context.json(error('Report not found.'), 404);
  });

  app.post('/api/admin/reports/:reportId/close', (context) => {
    const report = store.getReport(context.req.param('reportId'));
    if (!report) {
      return context.json(error('Report not found.'), 404);
    }
    store.closeReport(report.id);
    return context.json(getAdminReport(store.getReport(report.id)!));
  });

  app.delete('/api/admin/reports/:reportId', async (context) => {
    const report = store.getReport(context.req.param('reportId'));
    if (!report) {
      return context.json(error('Report not found.'), 404);
    }
    const upload = store.getUploadForReport(report.id);
    if (upload) {
      const paths = getUploadPaths(config, upload);
      await rm(paths.staging, { force: true });
      await rm(paths.completed, { force: true });
    }
    store.deleteReport(report.id);
    return context.body(null, 204);
  });

  app.get('/api/admin/reports/:reportId/world', (context) => {
    const upload = store.getUploadForReport(context.req.param('reportId'));

    if (upload?.status !== 'complete') {
      return context.json(error('World file not found.'), 404);
    }

    const path = getUploadPaths(config, upload).completed;
    context.header(
      'Content-Disposition',
      `attachment; filename="${upload.id}.sqlite3"`,
    );
    context.header(
      'Content-Type',
      upload.detectedMime ?? 'application/octet-stream',
    );
    return context.body(
      Readable.toWeb(createReadStream(path)) as ReadableStream,
    );
  });

  app.notFound((context) => context.json(error('Not found.'), 404));

  return app;
};
