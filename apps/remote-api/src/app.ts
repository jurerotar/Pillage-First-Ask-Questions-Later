import { createReadStream } from 'node:fs';
import { open, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';
import type { AppConfig } from './config.ts';
import {
  createRandomToken,
  createSignature,
  hashToken,
  isSignatureValid,
  isTokenValid,
} from './crypto.ts';
import type { Report, Store, Upload } from './store.ts';
import { removeUploadFiles } from './upload-files.ts';
import { readWorldPreview } from './world-preview.ts';
import {
  isWorldUploadExpired,
  sharedWorldLifetimeMs,
} from './world-retention.ts';

const oneHour = 60 * 60 * 1000;
const signedUrlLifetimeMs = 15 * 60 * 1000;
const sqliteSignature = Buffer.from('SQLite format 3\u0000', 'ascii');

const worldUploadSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  size: z.int().positive(),
});

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

const getSignedUrls = (
  config: AppConfig,
  report: { uploadExpiresAt: number | null },
  upload: Upload,
) => {
  const now = Date.now();
  const reportExpiration = report.uploadExpiresAt ?? Number.MAX_SAFE_INTEGER;
  const expiresAt = Math.min(
    now + signedUrlLifetimeMs,
    reportExpiration,
    upload.worldId
      ? upload.createdAt + sharedWorldLifetimeMs
      : Number.MAX_SAFE_INTEGER,
  );
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

  const match = /^bytes (\d+)-(\d+)\/(\d+)$/u.exec(header);

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

  if (config.allowedOrigins?.length) {
    app.use(
      '/api/*',
      cors({
        allowHeaders: ['Authorization', 'Content-Range', 'Content-Type'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        exposeHeaders: ['X-World-Size'],
        origin: config.allowedOrigins,
      }),
    );
  }

  app.use('/api/admin/*', async (context, next) => {
    const token = getBearerToken(context.req.raw);

    if (!token || !isTokenValid(config.apiToken, token)) {
      return context.json(error('Unauthorized.'), 401);
    }

    await next();

    return undefined;
  });

  // Keep deletion and upload writes for the same report from overlapping.
  const reportLocks = new Map<string, Promise<void>>();

  app.use('/api/*', async (context, next) => {
    const { path } = context.req;
    const reportMatch = /^\/api\/(?:admin\/)?reports\/([^/]+)/u.exec(path);
    const uploadMatch = /^\/api\/uploads\/([^/]+)/u.exec(path);
    const worldMatch = /^\/api\/game-worlds\/([^/]+)/u.exec(path);
    const upload = uploadMatch ? store.getUpload(uploadMatch[1]) : undefined;
    const reportId =
      reportMatch?.[1] ??
      worldMatch?.[1] ??
      upload?.reportId ??
      upload?.worldId;

    if (!reportId || context.req.method === 'GET') {
      await next();

      return;
    }

    const previous = reportLocks.get(reportId) ?? Promise.resolve();
    const { promise: current, resolve: release } =
      Promise.withResolvers<void>();

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
    const expires = Number(request.url.match(/[?&]expires=(\d+)/u)?.[1]);
    const signature = new URL(request.url).searchParams.get('signature');

    if (
      !upload ||
      isWorldUploadExpired(upload) ||
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

  app.post('/api/game-worlds', async (context) => {
    if (isRateLimited(context.req.raw, 'world-share', 5)) {
      return context.json(
        error('Too many world uploads from this address.'),
        429,
      );
    }

    const parsed = worldUploadSchema.safeParse(
      await context.req.json().catch(() => null),
    );

    if (!parsed.success) {
      return context.json(error('filename and size are required.'), 400);
    }

    const { filename, size } = parsed.data;

    if (size > config.maxFileBytes) {
      return context.json(
        error('The world file exceeds the per-file limit.'),
        413,
      );
    }

    const writeToken = createRandomToken();
    const world = store.createWorld(
      config.uploadLinkTtlMinutes === 0
        ? null
        : Date.now() + config.uploadLinkTtlMinutes * 60_000,
      hashToken(writeToken),
    );
    const upload = store.createUpload({
      expectedBytes: size,
      originalName: filename,
      worldId: world.id,
    })!;

    try {
      await (await open(getUploadPaths(config, upload).staging, 'wx')).close();
    } catch {
      store.deleteWorld(world.id);

      return context.json(error('Unable to reserve upload storage.'), 500);
    }

    return context.json(
      {
        worldId: world.id,
        writeToken,
        chunkSize: config.maxChunkBytes,
        ...getSignedUrls(config, world, upload),
      },
      201,
    );
  });

  app.post('/api/game-worlds/:worldId/upload-url', (context) => {
    const world = store.getWorld(context.req.param('worldId'));
    const token = getBearerToken(context.req.raw);
    const upload = world && store.getUploadForWorld(world.id);

    if (
      !world ||
      !token ||
      !upload ||
      isWorldUploadExpired(upload) ||
      !isTokenValid(world.writeTokenHash, hashToken(token)) ||
      (world.uploadExpiresAt !== null && world.uploadExpiresAt <= Date.now())
    ) {
      return context.json(
        error('Invalid or expired world upload capability.'),
        401,
      );
    }

    return context.json({
      chunkSize: config.maxChunkBytes,
      ...getSignedUrls(config, world, upload),
    });
  });

  app.get('/api/game-worlds/:worldId', (context) => {
    const upload = store.getUploadForWorld(context.req.param('worldId'));

    if (upload?.status !== 'complete' || isWorldUploadExpired(upload)) {
      return context.json(
        error('This game world is unavailable or has already been imported.'),
        404,
      );
    }

    try {
      const world = readWorldPreview(getUploadPaths(config, upload).completed);

      return context.json({
        ...world,
        size: upload.expectedBytes,
      });
    } catch {
      return context.json(
        error('Unable to read this game world’s details.'),
        422,
      );
    }
  });

  // Confirmation uses POST; link previews and crawlers cannot claim a world.
  app.post('/api/game-worlds/:worldId/download', (context) => {
    const worldId = context.req.param('worldId');
    const upload = store.getUploadForWorld(worldId);

    if (upload?.status !== 'complete' || isWorldUploadExpired(upload)) {
      return context.json(
        error('This game world is unavailable or has already been imported.'),
        404,
      );
    }

    const token = getBearerToken(context.req.raw);

    if (!token || token.length < 32 || token.length > 128) {
      return context.json(error('A download token is required.'), 400);
    }

    if (!store.claimWorld(worldId, hashToken(token))) {
      return context.json(
        error(
          'This game world is being imported on another device. Try again in 15 minutes.',
        ),
        409,
      );
    }

    context.header('Content-Type', 'application/vnd.sqlite3');
    context.header('Content-Length', String(upload.expectedBytes));
    context.header('X-World-Size', String(upload.expectedBytes));

    return context.body(
      Readable.toWeb(
        createReadStream(getUploadPaths(config, upload).completed),
      ) as ReadableStream,
    );
  });

  app.delete('/api/game-worlds/:worldId', async (context) => {
    const worldId = context.req.param('worldId');

    if (!store.getWorld(worldId)) {
      return context.body(null, 204);
    }

    const token = getBearerToken(context.req.raw);

    if (!token || !store.ownsWorldClaim(worldId, hashToken(token))) {
      return context.json(error('Invalid download capability.'), 401);
    }

    const upload = store.getUploadForWorld(worldId);

    if (upload) {
      await removeUploadFiles(config, upload);
    }

    store.deleteWorld(worldId);

    return context.body(null, 204);
  });

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

    const parsed = worldUploadSchema.safeParse(body);

    if (!parsed.success) {
      return context.json(error('filename and size are required.'), 400);
    }

    const { filename: originalName, size } = parsed.data;

    if (size > config.maxFileBytes) {
      return context.json(
        error('The world file exceeds the per-file limit.'),
        413,
      );
    }

    const existingUpload = store.getUploadForReport(report.id);

    if (existingUpload) {
      if (
        existingUpload.expectedBytes !== size ||
        existingUpload.originalName !== originalName
      ) {
        return context.json(
          error('A different world file already exists for this report.'),
          409,
        );
      }

      return context.json({
        chunkSize: config.maxChunkBytes,
        uploadId: existingUpload.id,
        ...getSignedUrls(config, report, existingUpload),
      });
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

    if (!upload) {
      return context.json(error('A world upload was not found.'), 404);
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

    if (upload?.status === 'complete') {
      return context.json({ status: 'complete' });
    }

    if (!upload) {
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
      await removeUploadFiles(config, upload);
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
