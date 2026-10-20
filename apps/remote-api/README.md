# @pillage-first/remote-api

This app contains the game API for Pillage First!, supporting bug reports and one-time game world sharing between devices. Each report can include one exported SQLite game world. The service uses the `@pillage-first/remote-api` workspace and `deploy-remote-api.yml` deployment workflow.

## Local setup

Copy `.env.example` to `.env` inside `apps/remote-api` and configure these values:

- `UPLOAD_URL_SECRET`, `API_TOKEN` - Random secrets, each at least 32 characters long.
- `APP_DATA_DIRECTORY` - Absolute path to a writable directory outside this repository. This directory contains the database and uploaded files.

Run these commands from the repository root:

```sh
npm install
npm run remote-api --workspace=@pillage-first/remote-api
```

Set `VITE_API_URL` in the web app to the URL of this service.

### Checks

```sh
npm run type-check --workspace=@pillage-first/remote-api
npm run test --workspace=@pillage-first/remote-api
```

## API

1. Create a report with `POST /api/reports`, passing `title`, `description` and optional `contact`. The response contains `reportId` and `writeToken`. Keep the token in memory.
2. Create its upload with `POST /api/reports/:reportId/world`, passing `filename` and `size`. Use `Authorization: Bearer <writeToken>`.
3. Upload chunks with `PUT` to the returned `chunkUrlTemplate`, replacing `{chunkIndex}` with the chunk index. Use the returned `chunkSize` and send `Content-Length` and `Content-Range: bytes start-end/total`.
4. Finish the upload with `POST` to the returned `completeUrl`.

Upload URLs expire after 15 minutes. Request new URLs with `POST /api/reports/:reportId/world/upload-url`, using the same write token.
`UPLOAD_LINK_TTL_MINUTES` controls how long the write token remains valid. Set it to `0` to disable expiry.

Download a game world with `GET /api/admin/reports/:reportId/world`, using `Authorization: Bearer <API_TOKEN>`.

### Report administration

All admin endpoints require `Authorization: Bearer <API_TOKEN>`:

- `GET /api/admin/reports` - List reports, newest first.
- `GET /api/admin/reports/:reportId` - View report details and upload information.
- `POST /api/admin/reports/:reportId/close` - Close a report. Closed reports and their files remain available.
- `DELETE /api/admin/reports/:reportId` - Delete a report and its pending or completed world upload.

The admin frontend is available at `/bugs` in the [main web app](../web/README.md#bug-report-administration). Set `ALLOWED_ORIGIN` to the web app origin for both report submissions and administration.

### Game world sharing

1. Reserve an upload with `POST /api/game-worlds`, passing `filename` and `size`. The response contains `worldId`, `writeToken`, `chunkSize`, `chunkUrlTemplate`, and `completeUrl`.
2. Upload and finalize chunks using the same protocol as report attachments. Renew signed URLs with `POST /api/game-worlds/:worldId/upload-url` using the write token.
3. Share the web app URL `/game-worlds/import?world-id=<worldId>`. The world ID grants access to this copy; share it only with the intended recipient.
4. After explicit confirmation, the recipient generates a random download token (32–128 characters) and sends `POST /api/game-worlds/:worldId/download` with `Authorization: Bearer <downloadToken>`. The response is the SQLite file. GET requests do not download or claim worlds.
5. Import and register the world locally, then send `DELETE /api/game-worlds/:worldId` with the same download token. This deletes the file, chunks, and metadata, invalidating the link. Deletion is idempotent.

Downloading claims the world for 15 minutes, preventing concurrent downloads with different tokens. The same token can retry interrupted downloads. If a device abandons an import, another device can claim it after the lease expires. Failed imports keep the remote copy available for retry. Completed uploads remain available until deletion; `UPLOAD_LINK_TTL_MINUTES` limits upload authorization only. Shared worlds do not appear in the bug report administration UI.

Deploy the API before the web app. Use a new application directory and an empty data directory; existing bug reporter files do not need to be migrated.

### Upload limits

The default limit is 250 MiB per file and report, with 8 MiB chunks. Use `MAX_FILE_BYTES`, `MAX_REPORT_BYTES` and `MAX_CHUNK_BYTES` to change these limits.

The app checks uploaded files for the SQLite 3 header and rate-limits requests by IP address. Configure Apache to overwrite `X-Forwarded-For` with the actual client address before proxying requests.

## cPanel deployment

Create a Node.js 24.10 application for `api.pillagefirst.com` with these settings:

- Application root - `/home/ACCOUNT/remote-api/current`, pointing to the current release.
- Startup file - `apps/remote-api/src/server.ts`.
- Environment variables - Values from `.env.example`, configured through cPanel.
- `APP_DATA_DIRECTORY` - A writable directory outside the releases and `public_html`, for example `/home/ACCOUNT/remote-api-data`.
- `PUBLIC_BASE_URL` - `https://api.pillagefirst.com`.
- `ALLOWED_ORIGIN` - Public game URL, for example `https://pillagefirst.com`.

Add these GitHub Actions secrets:

| Secret | Value |
| --- | --- |
| `CPANEL_SSH_HOST` | SSH host, including `user@` if needed |
| `CPANEL_SSH_PORT` | SSH port |
| `CPANEL_SSH_PRIVATE_KEY` | Deploy key with access to the application directory |
| `CPANEL_SSH_KNOWN_HOSTS` | SSH host's `known_hosts` entry |
| `CPANEL_DEPLOY_PATH` | Application parent directory, for example `/home/ACCOUNT/remote-api` |

Set the web deployment environment variable `VITE_API_URL=https://api.pillagefirst.com` and update `CPANEL_DEPLOY_PATH` to the new application directory.

Run **Deploy remote API** from GitHub Actions. It installs production dependencies, updates `current` and restarts the app.
Uploaded files stay in `APP_DATA_DIRECTORY`. Five previous releases are kept for rollback.

### Rollback

Point `current` to a previous release and restart the app:

```sh
cd /home/ACCOUNT/remote-api
ln -sfn releases/PREVIOUS_COMMIT current.next
mv -Tf current.next current
touch current/tmp/restart.txt
```
