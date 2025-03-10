# App directory naming convention

Folder structure is following code colocation guidelines.

`(xxx)` - Folders marked with parenthesis `()` indicate a route group. You may encounter additional route groups nested inside, but
typically you'll find `/components`, `/hooks`,... where the code in these folders is only used in this particular route group.

* Example of a group: `(public)/page.tsx` -> `/`
* Example of a nested route group: `(public)/(create-new-server)/page.tsx` -> `/create-new-server`
* Example of a component folder inside a route group: `(public)/(create-new-server)/components` -> These components are only used inside of
  `(create-new-server)` route group
* Example of a component folder outside a route group: `(public)/components` -> These components are only used inside of `(public)` route
  group, which means they can also be used in `(create-new-server)` route group

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
