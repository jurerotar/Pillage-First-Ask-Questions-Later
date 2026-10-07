# @pillage-first/bug-reporter

This app contains the bug report API for Pillage First! Each report can include one exported SQLite game world.

## Local setup

Copy `.env.example` to `.env` inside `apps/bug-reporter` and configure these values:

- `UPLOAD_URL_SECRET`, `ADMIN_API_TOKEN` - Random secrets, each at least 32 characters long.
- `APP_DATA_DIRECTORY` - Absolute path to a writable directory outside this repository. This directory contains the database and uploaded files.

Run these commands from the repository root:

```sh
npm install
npm run bug-reporter --workspace=@pillage-first/bug-reporter
```

Set `VITE_BUG_REPORTER_URL` in the web app to the URL of this service.

### Checks

```sh
npm run type-check --workspace=@pillage-first/bug-reporter
npm run test --workspace=@pillage-first/bug-reporter
```

## API

1. Create a report with `POST /api/reports`, passing `title`, `description` and optional `contact`. The response contains `reportId` and `writeToken`. Keep the token in memory.
2. Create its upload with `POST /api/reports/:reportId/world`, passing `filename` and `size`. Use `Authorization: Bearer <writeToken>`.
3. Upload chunks with `PUT` to the returned `chunkUrlTemplate`, replacing `{chunkIndex}` with the chunk index. Use the returned `chunkSize` and send `Content-Length` and `Content-Range: bytes start-end/total`.
4. Finish the upload with `POST` to the returned `completeUrl`.

Upload URLs expire after 15 minutes. Request new URLs with `POST /api/reports/:reportId/world/upload-url`, using the same write token.
`UPLOAD_LINK_TTL_MINUTES` controls how long the write token remains valid. Set it to `0` to disable expiry.

Download a game world with `GET /api/admin/reports/:reportId/world`, using `Authorization: Bearer <ADMIN_API_TOKEN>`.

### Report administration

All admin endpoints require `Authorization: Bearer <ADMIN_API_TOKEN>`:

- `GET /api/admin/reports` - List reports, newest first.
- `GET /api/admin/reports/:reportId` - View report details and upload information.
- `POST /api/admin/reports/:reportId/close` - Close a report. Closed reports and their files remain available.
- `DELETE /api/admin/reports/:reportId` - Delete a report and its pending or completed world upload.

The admin frontend is available in [@pillage-first/bug-reporter-ui](../bug-reporter-ui/README.md).
Set `ADMIN_ALLOWED_ORIGIN` to its origin when hosting it separately from this API.

### Upload limits

The default limit is 250 MiB per file and report, with 8 MiB chunks. Use `MAX_FILE_BYTES`, `MAX_REPORT_BYTES` and `MAX_CHUNK_BYTES` to change these limits.

The app checks uploaded files for the SQLite 3 header and rate-limits requests by IP address. Configure Apache to overwrite `X-Forwarded-For` with the actual client address before proxying requests.

## cPanel deployment

Create a Node.js 24.10 application with these settings:

- Application root - `/home/ACCOUNT/bug-reporter/current`, pointing to the current release.
- Startup file - `apps/bug-reporter/src/server.ts`.
- Environment variables - Values from `.env.example`, configured through cPanel.
- `APP_DATA_DIRECTORY` - A writable directory outside the releases and `public_html`, for example `/home/ACCOUNT/bug-reporter-data`.
- `PUBLIC_BASE_URL` - Public URL of this service.
- `ALLOWED_ORIGIN` - Public game URL, for example `https://pillagefirst.com`.

Add these GitHub Actions secrets:

| Secret | Value |
| --- | --- |
| `CPANEL_SSH_HOST` | SSH host, including `user@` if needed |
| `CPANEL_SSH_PORT` | SSH port |
| `CPANEL_SSH_PRIVATE_KEY` | Deploy key with access to the application directory |
| `CPANEL_SSH_KNOWN_HOSTS` | SSH host's `known_hosts` entry |
| `CPANEL_DEPLOY_PATH` | Application parent directory, for example `/home/ACCOUNT/bug-reporter` |

Run **Deploy bug reporter** from GitHub Actions. It installs production dependencies, updates `current` and restarts the app.
Uploaded files stay in `APP_DATA_DIRECTORY`. Five previous releases are kept for rollback.

### Rollback

Point `current` to a previous release and restart the app:

```sh
cd /home/ACCOUNT/bug-reporter
ln -sfn releases/PREVIOUS_COMMIT current.next
mv -Tf current.next current
touch current/tmp/restart.txt
```
