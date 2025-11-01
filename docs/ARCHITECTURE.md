# Architecture Documentation for `Pillage First, Ask Questions Later`

## 1. Introduction

This document provides an overview of the architecture used in **Pillage First, Ask Questions Later** game. It covers
some implementation details, notes important files and caveats.
Please refer to [contribution guide](../CONTRIBUTING.md) for the list of technologies and project structure used.

### 1.1 Important caveats

For all of its history, Travian has always been an online-exclusive game. Since most of our users know it only as such,
one of the most common requests we receive from the users is for this project to eventually add a multiplayer component.
Turning this into an online app isn't our goal right now, but we've tried to structure things so a future contributor
could do it with as little extra work as possible.

Because of this, this application was constructed to behave as a typical client-server app, even though everything here
takes place only on client's device.

## 2. App architecture

The app consists of 3 separate logic layers:

- SQLite WASM persisted database
- API worker
- Frontend

### SQLite WASM persisted database

This project uses [SQLite WASM](https://github.com/sqlite/sqlite-wasm) as data storage provider. Each game world has its
own database. Database is created and seeded on game world creation and fully deleted on game world deletion.

All table schemas are defined with `STRICT` mode. Most indexes are defined right by the corresponding schema, but some
indexes are defined separately and are executed after seeding to improve seeding performance. We use handwritten (no
ORM) SQL queries. Reason for this is that due to us having no control over which device this app is being run on, we
have to limit any unnecessary wrappers.

### API worker

API worker is a worker that implements a RESTful-like API. Its purpose is to act as a typical RESTful API; receiving
requests and sending responses.
It only exists in the offline version of the application, and it's meant to lessen the architectural differences gap an
offline-first and online app.
During runtime, API worker listens to worker messages sent by the frontend, parses out the `pathname` and `method`,
invokes a `handler` and then returns a response using `worker.postMessage`.
API worker defines a set of "endpoints", which look like this:

```ts
const serverRoutes = [
  {
    method: 'GET',
    path: '/server',
    handler: getServer,
  },
];
```

These endpoints mimic traditional RESTful API endpoints. Each of these endpoints invokes a `handler` function. Handlers
can be thought of as controllers in traditional MVC architecture. Handler functions may receive arguments through
pathname, search params or body.

### Frontend

Frontend is built with React and TypeScript. UI components were generated with ShadCN. State management and data
fetching is
handled with `tanstack/query`. It's built with async in mind, loading states are handled out of the box.

Frontend hooks, responsible for fetching data, require a special `fetcher` function. A fetcher is a function that allows
the frontend to connect to a specified data source. In a typical client-server app,
this fetcher function would simply be browser's native `fetch`. In an offline version, fetcher looks somewhat like this:

```ts
export type Fetcher = ReturnType<typeof createWorkerFetcher>;

export const createWorkerFetcher = (worker: Worker) => {
  return async <TData, TBody = unknown>(
    url: string,
    args?: ApiWorkerMessage<TBody>,
  ): Promise<{ data: TData }> => {
    const { port1, port2 } = new MessageChannel();

    return new Promise((resolve) => {
      port1.addEventListener('message', ({ data }) => {
        port1.close();
        resolve(data);
      });
      port1.start();

      const message: PostMessage = {
        url,
        method: args?.method ?? 'GET',
        body: args?.body ?? null,
        params: args?.params ?? null,
      };

      worker.postMessage(message, [port2]);
    });
  };
};
```

This fetcher function follows the specification of the native `fetch` function. By making sure we're following the
specification as close as possible, we're able to connect to different data providers (api-worker in offline version and
an actual backend in potential online version), without having to do a large rewrite.

**Relevant files**:

- https://github.com/jurerotar/Pillage-First-Ask-Questions-Later/blob/master/app/(game)/providers/api-provider.tsx
- https://github.com/jurerotar/Pillage-First-Ask-Questions-Later/blob/master/app/(game)/utils/worker-fetch.ts

#### How it all works together

In the offline version of the app, there is no server. Everything happens exclusively on your device.
But, to allow the same codebase to work with an online version with minimal required changes, we can't just simply
manipulate data on the frontend.

For this reason, we implemented the API worker.

When a user opens a game world, the app spawns a new worker and runs the API worker script on it. The purpose of this
worker is to act as an RESTful API. It exposes required REST API endpoints, queries and writes to the database, posts
responses through message ports, acts as a WebSocket server,.... It essentially provides a service you'd typically
expect from a fully-fledged
backend. This allows the frontend to be truly headless, making it integratable by both offline and online versions of
the app. Frontend
manipulates data only through this worker and no other data is persisted otherwise.

This design does complicate the codebase for the offline-version of the application, but it's the only way to allow the
headless nature of the frontend. By simply changing the fetcher function, you are able to connect the frontend to a
different data
source (e.g. actual backend for an online app), without having to touch rest of the frontend.

### Important files

- [`api-worker.ts`](/app/(game)/api/api-worker.ts)
- [`api-routes.ts`](/app/(game)/api/api-routes.ts)
- [`api-provider.tsx`](/app/(game)/providers/api-provider.tsx)

### How would a multiplayer integration look like?

Frontend expects a RESTful API and a WebSocket server. The list of expected routes is found in `api-routes.ts`. Request
parameters and responses
are found in `app/(game)/api` folder. To integrate your own backend, you need to implement the API routes (e.g.,
fetching game state,
interacting with events) and WebSocket support. Once these routes are live, provide a `fetcher` function in the
`api-provider.tsx`. This
function is typically a `fetch` function that connects the frontend to the backend. After this, the app will be fully
connected to the
backend
for multiplayer functionality.

Optionally, you can remove the `app/(game)/api` folder from your fork, as it will no longer be needed when connecting to
a real backend.
