# @pillage-first/web

This is the main Pillage First! web app.

## Project structure

Folder structure is following code colocation guidelines.

**Keep related files together** – A component's styles, tests, and utilities should be in the same directory.

**Encapsulate logic per feature** – Features should have their own directory inside the app/ folder, containing its related components,
hooks, providers,... and tests.

### Folder naming convention

`(xxx)` - Folders marked with parenthesis `()` indicate a route group. You may encounter additional route groups nested inside, but
typically you'll find `/components`, `/hooks`,... where the code in these folders is only used in this particular route group.

* Example of a group: `(public)/page.tsx` -> `/`
* Example of a nested route group: `(public)/(create-new-game-world)/page.tsx` -> `/create-new-game-world`
* Example of a component folder inside a route group: `(public)/(create-new-game-world)/components` -> These components are only used inside of
  `(create-new-game-world)` route group
* Example of a component folder outside a route group: `(public)/components` -> These components are only used inside of `(public)` route
  group, which means they can also be used in `(create-new-game-world)` route group

`xxx` - Folder without any special markers are used for code that belongs to that specific group or pages. Typical folders here are
`components`, `providers`, `hooks`,...
* Example: `(group)/components` -> components which are only used in this specific group

`layout`, `page` - Reserved file names that may exist on each group or page level.

We're following [React Router 7 conventions](https://reactrouter.com/dev/guides/start/routing). Each `page` and `layout` must have a default export. Other exports should be added only when needed:

* `clientLoader` - https://remix.run/docs/en/main/route/client-loader
* `ErrorBoundary` - https://remix.run/docs/en/main/route/error-boundary
* `links` - https://remix.run/docs/en/main/route/links
* `loader` - https://remix.run/docs/en/main/route/loader
* `meta` - https://remix.run/docs/en/main/route/meta

## Bug report administration

The admin frontend is available at `/bugs`, with report details at `/bugs/reports/:reportId`.
Run `npm run dev --workspace=@pillage-first/web` and open `http://localhost:5173/bugs`.

Set `VITE_API_URL` in the web app environment to the game API service URL (`https://api.pillagefirst.com` for production).

The same service handles game world sharing. In a world's actions menu, choose **Share game world**, upload it, then copy the import link or scan its QR code on another device. The `/game-worlds/import?world-id=...` page requires confirmation before downloading. After the world has been imported and registered locally, its remote copy is deleted. If deletion fails, **Finish sharing** retries cleanup without importing a second local copy.
This is the same setting used for submitting in-game bug reports. Sign in using the service's `API_TOKEN`.
The token is remembered in local storage on the web app origin until sign-out. A token saved on the former standalone frontend origin is not transferred; sign in again.

Set `ALLOWED_ORIGIN` on the service to the main web app origin (`http://localhost:5173` for local development).
The browser calls the service directly. Never put `API_TOKEN` in a `VITE_` environment variable.

Build with `npm run build --workspace=@pillage-first/web`. The existing Netlify redirects serve both `/bugs` and its detail URLs.
The former `@pillage-first/bug-reporter-ui` workspace is deprecated and no longer builds separately.
