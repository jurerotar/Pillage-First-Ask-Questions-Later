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

#### Table schemas

All table schemas are defined in SQL files with `STRICT` mode enabled. This ensures that SQLite enforces data types for
all columns, providing better data integrity. Schemas often include foreign key constraints to maintain relational
integrity.

Example schema (`villages-schema.sql`):

```sql
CREATE TABLE villages
(
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT,
  tile_id INTEGER NOT NULL,
  player_id INTEGER NOT NULL,

  UNIQUE (tile_id),

  FOREIGN KEY (tile_id) REFERENCES tiles (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) STRICT;
```

#### Seeders

Seeders are responsible for populating the database with initial data when a game world is created. This includes
loading static data (like building and unit statistics) and generating dynamic world data (like the map grid, oases, and
starting player information).

Seeders use the `database` facade to execute `INSERT` statements, often in batches (using `batchInsert` utility) for
better performance when dealing with large amounts of data like map tiles.

Example seeder (`server-seeder.ts`):

```ts
export const serverSeeder = (database: DbFacade, server: Server): void => {
  const { id, version, name, slug, createdAt, seed, configuration, playerConfiguration } = server;
  const { speed, mapSize } = configuration;
  const { name: playerName, tribe } = playerConfiguration;

  database.exec({
    sql: `
      INSERT INTO
        servers
      (id, version, name, slug, created_at, seed, speed, map_size, player_name, player_tribe)
      VALUES
        ($id, $version, $name, $slug, $created_at, $seed, $speed, $map_size, $player_name, $player_tribe);
    `,
    bind: {
      $id: id,
      $version: version,
      $name: name,
      $slug: slug,
      $created_at: createdAt,
      $seed: seed,
      $speed: speed,
      $map_size: mapSize,
      $player_name: playerName,
      $player_tribe: tribe,
    },
  });
};
```

#### Post-seeding indexes

While most indexes are defined directly within the schema files, some indexes are defined in separate SQL files and are
executed only *after* seeding is complete. This is done to improve seeding performance; inserting thousands of rows into
a table that already has multiple indexes is significantly slower than inserting them into a table without indexes and
creating the indexes afterwards.

We use handwritten (no ORM) SQL queries. Reason for this is that due to us having no control over which device this app
is being run on, we have to limit any unnecessary wrappers.

### API worker

API worker is a worker that implements a RESTful-like API. Its purpose is to act as a typical RESTful API; receiving
requests and sending responses.
It only exists in the offline version of the application, and it's meant to lessen the architectural differences gap an
offline-first and online app.
During runtime, API worker listens to worker messages sent by the frontend, parses out the `pathname` and `method`,
invokes a `controller` and then returns a response using `worker.postMessage`.

#### Controllers

Controllers are the core logic handlers for API requests. Each controller is responsible for a specific endpoint or a
group of related endpoints. They interact with the database, perform business logic, and return data that follows a
predefined schema.

Controllers are created using the `createController` utility, which provides access to the `database` facade and other
utilities.

Example controller (`server-controllers.ts`):

```ts
export const getServer = createController('/server')(({ database }) => {
  return database.selectObject({
    sql: `
      SELECT
        id, version, name, slug, created_at, seed, speed, map_size, player_name, player_tribe
      FROM
        servers;
    `,
    schema: serverDbSchema,
  })!;
});
```

API worker defines a set of "endpoints", which look like this:

```ts
const serverRoutes = [
  {
    method: 'GET',
    path: '/server',
    controller: getServer,
  },
];
```

These endpoints mimic traditional RESTful API endpoints. Each of these endpoints invokes a `controller` function.
Controllers may receive arguments through pathname, search params or body.

### Frontend

Frontend is built with React and TypeScript. UI components were generated with ShadCN. State management and data
fetching is
handled with `@tanstack/react-query`. It's built with async in mind, loading states are handled out of the box.

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

- [`api-worker.ts`](/packages/api/src/api-worker.ts)
- [`api-routes.ts`](/packages/api/src/routes/api-routes.ts)
- [`api-provider.tsx`](/apps/web/app/(game)/providers/api-provider.tsx)

### How would a multiplayer integration look like?

Frontend expects a RESTful API and a WebSocket server. The list of expected routes is found in `api-routes.ts`. Request
parameters and responses
are found in `/packages/api` package. To integrate your own backend, you need to implement the API routes (e.g.,
fetching game state,
interacting with events) and WebSocket support. Once these routes are live, provide a `fetcher` function in the
`api-provider.tsx`. This
function is typically a `fetch` function that connects the frontend to the backend. After this, the app will be fully
connected to the
backend
for multiplayer functionality.

Optionally, you can remove the `/packages/api` package from your fork, as it will no longer be needed when connecting to
a real backend.
