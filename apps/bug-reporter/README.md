# Bug reporter

This is the server-side bug-report service for Pillage First. It accepts one exported game world for each report. The client creates a report, reserves its world upload with the returned write capability, uploads fixed-size chunks to the signed URLs, and then completes the upload.

The service accepts only a SQLite 3 file based on bytes read from the completed upload. It never uses the client filename as a path or trusts the client MIME type. Files are stored under `APP_DATA_DIRECTORY`, which is required to be outside the release and `public_html` directories. Downloads are an authenticated admin endpoint and always use `Content-Disposition: attachment`.

## Local setup

Copy `.env.example` to `.env.local`, set long random values for `UPLOAD_URL_SECRET` and `ADMIN_API_TOKEN`, and set `APP_DATA_DIRECTORY` to an absolute directory outside this repository. Then run:

```sh
npm install
npm run dev --workspace=@pillage-first/bug-reporter
```

Run the targeted checks with:

```sh
npm run type-check --workspace=@pillage-first/bug-reporter
npm run test --workspace=@pillage-first/bug-reporter
```

## API protocol

`POST /api/reports` accepts `{ "title", "description", "contact?" }` and returns a `reportId` and a 256-bit `writeToken`. Keep that token only in memory; it authorizes creating the report's single world upload.

`POST /api/reports/:reportId/world` accepts `{ "filename", "size" }` with `Authorization: Bearer <writeToken>`. `filename` is retained as metadata only. The response includes a fixed `chunkSize`, a signed `chunkUrlTemplate`, and a signed `completeUrl`.

For every chunk `i`, `PUT` the bytes to `chunkUrlTemplate` after replacing `{chunkIndex}` with `i`. Send both `Content-Length` and `Content-Range: bytes start-end/total`; chunks are written at the exact server-validated offset. Finish with `POST completeUrl`. Signed upload URLs have a 15-minute lifetime; renew a pending upload's URLs with `POST /api/reports/:reportId/world/upload-url` and the write capability if they expire. The report capability can optionally expire through `UPLOAD_LINK_TTL_MINUTES`.

`GET /api/admin/reports/:reportId/world` requires `Authorization: Bearer <ADMIN_API_TOKEN>`. This is the only download route.

## Limits and abuse controls

The defaults are 250 MiB per file and report, with 8 MiB chunks. Set `MAX_FILE_BYTES`, `MAX_REPORT_BYTES`, and `MAX_CHUNK_BYTES` to change them. The app rate-limits report creation and each signed upload URL by source address. Configure cPanel/Apache to overwrite `X-Forwarded-For` with the actual client address before proxying so this cannot be spoofed.

## cPanel deployment

Use a Node.js 24.10 application whose application root is the stable `current` symlink, for example `/home/ACCOUNT/bug-reporter/current`; do not point it at a release directory. Set its startup file to `apps/bug-reporter/src/server.ts` and use cPanel's environment-variable UI to configure the values from `.env.example`. Node runs this erasable TypeScript directly, so no compiled release output is needed.

Set `APP_DATA_DIRECTORY` to a sibling outside `public_html`, such as `/home/ACCOUNT/bug-reporter-data`. It contains the SQLite metadata database, staging files, and completed uploads, and is deliberately excluded from every release. The Node app must have read/write access to it.

Set `ALLOWED_ORIGIN` to the public game origin, for example `https://pillagefirst.com`, and configure the web app's build-time `VITE_BUG_REPORTER_URL` to the public URL of this service. The game uses it to submit its report and signed chunk uploads.

The manual GitHub workflow needs these repository secrets:

| Secret | Value |
| --- | --- |
| `CPANEL_SSH_HOST` | SSH hostname, optionally `user@host` |
| `CPANEL_SSH_PORT` | SSH port, for example `5050` on NEOSERV |
| `CPANEL_SSH_PRIVATE_KEY` | Deploy key with access only to the application directory |
| `CPANEL_SSH_KNOWN_HOSTS` | Pinned `known_hosts` line for the SSH host |
| `CPANEL_DEPLOY_PATH` | Absolute application parent, for example `/home/ACCOUNT/bug-reporter` |

Run **Deploy bug reporter** manually from GitHub Actions. It builds a release, installs only production dependencies inside a new `releases/<commit>` directory, atomically moves `current` to the new release, and touches Passenger's restart file. It retains five old releases for instant rollback and never copies, deletes, or changes the configured data directory.

To roll back, update `current` to a previous release and touch `current/tmp/restart.txt`:

```sh
cd /home/ACCOUNT/bug-reporter
ln -sfn releases/PREVIOUS_COMMIT current.next
mv -Tf current.next current
touch current/tmp/restart.txt
```
