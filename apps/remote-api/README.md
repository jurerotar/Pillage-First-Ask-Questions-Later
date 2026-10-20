# @pillage-first/remote-api

API for bug reports and one-time game world sharing.

## Configuration

The API will not start without these environment variables:

| Variable | Value |
| --- | --- |
| `API_TOKEN` | Required admin sign-in token; random, at least 32 characters |
| `UPLOAD_URL_SECRET` | Required signing secret; random, at least 32 characters |
| `APP_DATA_DIRECTORY` | Writable absolute path outside the app directory, e.g. `/home/ACCOUNT/remote-api-data` |
| `PUBLIC_BASE_URL` | `https://api.pillagefirst.com` in production |

Set `ALLOWED_ORIGIN` to a comma-separated list of allowed browser origins, e.g. `https://pillagefirst.com,http://localhost:5173`. Origins match exactly, including scheme and port; use no trailing slash. A single origin still works. Set `VITE_API_URL=https://api.pillagefirst.com` in the web deployment environment. Keep both secrets on the API server; never expose them through `VITE_` variables.

Optional settings and defaults are in [.env.example](.env.example): 250 MiB per file/report, 8 MiB chunks, and 24-hour upload authorization. `UPLOAD_LINK_TTL_MINUTES=0` disables upload authorization expiry.

## Local development

Copy `.env.example` to `.env`, replace the secrets, and use local URLs and a local data directory. From the repository root:

```sh
npm install
npm run remote-api --workspace=@pillage-first/remote-api
npm run type-check --workspace=@pillage-first/remote-api
npm run test --workspace=@pillage-first/remote-api -- --run
```

## cPanel deployment

| Setting | Value |
| --- | --- |
| Node.js | 24.18 or newer, Production mode |
| Application root | `remote-api`, relative to `/home/ACCOUNT` |
| Application URL | `api.pillagefirst.com`, no path suffix |
| Startup file | `current/apps/remote-api/src/server.ts` |

Configure the environment variables above in cPanel, including **`API_TOKEN` and `UPLOAD_URL_SECRET`**. Local `.env` files are not deployed. Keep the application root stable; do not set it to the `current` symlink.

GitHub Actions requires `CPANEL_SSH_HOST`, `CPANEL_SSH_PORT`, `CPANEL_SSH_PRIVATE_KEY`, `CPANEL_SSH_KNOWN_HOSTS`, and `CPANEL_DEPLOY_PATH=/home/ACCOUNT/remote-api`.

Run **Deploy remote API** before deploying the web app. It installs dependencies, switches `current`, and restarts the app. Verify `GET /health` returns `{"status":"ok"}`. Existing bug reporter data does not need to be migrated.

To roll back, point `current` to a previous directory under `releases` and touch `remote-api/tmp/restart.txt`. Uploaded files remain in `APP_DATA_DIRECTORY`.

## API

- Bug reports: `POST /api/reports` accepts `title`, `description`, and optional `contact`. Use its `writeToken` to reserve an attachment with `POST /api/reports/:reportId/world`.
- Sharing: `POST /api/game-worlds` reserves a world upload and returns `worldId`, `writeToken`, and upload URLs. Shared worlds expire 24 hours after reservation, including unfinished uploads. Expired links stop working immediately; startup cleanup and a sweep every minute remove their files and metadata. Bug report attachments are retained.
- Both upload reservations accept `filename` and `size`. PUT chunks to `chunkUrlTemplate` using `chunkSize` and `Content-Range: bytes start-end/total`, then POST to `completeUrl`. Signed URLs last 15 minutes; renew with `POST /api/reports/:reportId/world/upload-url` or `POST /api/game-worlds/:worldId/upload-url`, using the write token as a bearer token.
- Share `/game-worlds/import?world-id=<worldId>`. After confirmation, POST to `/api/game-worlds/:worldId/download` with a random 32?128 character bearer token. This claims the download for 15 minutes; the same token can retry. After successful local import, DELETE `/api/game-worlds/:worldId` using that token. Uploaded copies are deleted after import or 24 hours.
- Admin UI: `/bugs`, sign in with `API_TOKEN`. Admin routes under `/api/admin/reports` require that token and support listing, details, closing, deletion, and world downloads.

Files must have a SQLite 3 header. Requests are rate limited by IP; configure the proxy to overwrite `X-Forwarded-For` with the actual client address.
