# App directory naming convention

`(xxx)` - Folders marked with square brackets `()` indicate a group or an url sub-path. You may encounter additional `/components`, `/hooks`,... sub-folders, where the code in these folders is only used in this particular group.
  * Example of a group: `(public)/page` -> `/page`
  * Example of an url sub-path: `(game)/page` -> `/game/page`

`xxx` - Folder without any special markers are used for code that belongs to that specific group or pages.
  * Example: `(group)/components` -> components which are only used in this specific group

`layout`, `page`, `skeleton` - Reserved file names that may exist on each group or page level.

We're following [React Router 7 conventions](https://reactrouter.com/dev/guides/start/routing). Each `page` and `layout` must have a default export. Other exports should be added only when needed:

* `clientLoader` - https://remix.run/docs/en/main/route/client-loader
* `ErrorBoundary` - https://remix.run/docs/en/main/route/error-boundary
* `HydrateFallback` - https://remix.run/docs/en/main/route/hydrate-fallback
* `links` - https://remix.run/docs/en/main/route/links
* `loader` - https://remix.run/docs/en/main/route/loader
* `meta` - https://remix.run/docs/en/main/route/meta
