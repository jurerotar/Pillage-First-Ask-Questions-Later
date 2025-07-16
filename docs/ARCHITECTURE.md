# Architecture Documentation for `Pillage First, Ask Questions Later`

## 1. Introduction

This document provides an overview of the architecture, structure, and key technologies used in the development of the **Pillage First, Ask
Questions Later** game. It covers some implementation details, notes important files and describes application architecture.

---

## 2. Technology Stack

- **Frontend:** [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org/)
- **State Management:** [React Query](https://tanstack.com/query/latest)
- **UI Framework:** [Tailwind CSS](https://tailwindcss.com)
- **Routing:** [React Router v7 - framework mode](https://reactrouter.com)
- **Build System:** [Vite](https://vitejs.dev)
- **Format and lint:** [Biome.js](https://biomejs.dev)
- **Localization:** [i18next](https://www.i18next.com) + [react-i18next](https://react.i18next.com) + [i18next-parser](https://github.com/i18next/i18next-parser)
- **Unit testing:** [Vitest](https://vitest.dev)
- **Deployment:** Netlify ([Master Deploy](https://pillagefirst.netlify.app) | [Dev Deploy](https://develop--pillagefirst.netlify.app))
- **Version Control:** GitHub ([Repository](https://github.com/jurerotar/Pillage-First-Ask-Questions-Later))

---

## 3. Project Structure and important files

The project follows a **colocation** principle, meaning files related to a feature (components, tests, hooks,... and utilities) are kept
close to each other within the same directory. This approach improves maintainability and makes it easier to find and modify related code.

**Keep related files together** – A component's styles, tests, and utilities should be in the same directory.

**Encapsulate logic per feature** – Features should have their own directory inside the app/ folder, containing its related components,
hooks, providers,... and tests.

```
├── .github                 # GitHub-specific configurations and workflows
├── .husky                  # Pre-commit hooks for enforcing code quality
├── app                     # Main application source code
│   ├── (design-system)     # Temporary route group allowing you to see a list of icons app uses (/design-system/icons)
│   ├── (game)              # Game-specific routes and assets
│   │   ├── (xxx)           # Game routes (/resources, /map,...)
│   │   ├── providers       # Game engine, game-state,... providers
│   │   ├── api             # local-api
│   │   ├── assets          # Buildings, units, items... data
│   │   ├── layout.ts       # Game-only layout
│   │   ├── ...
│   ├── (public)            # Public pages (/, /create-new-server)
│   │   ├── layout.ts       # Public-pages only layout
│   │   ├── ...
│   ├── interfaces          # TypeScript interfaces and types
│   ├── localization        # Localization files
│   ├── tests               # Unit test environments and mocks
│   ├── root.tsx            # Root entry point for the application
│   ├── routes.ts           # Application route definitions
│   ├── ...
├── docs                    # Project documentation
├── public                  # Static files served by the app (e.g., index.html)
├── scripts                 # Custom scripts for development and build automation
```

---

## 4. App architecture

The app consists of 3 separate logic layers:

- Frontend
- API worker
- In-memory database

### Frontend

Frontend is built with React and TypeScript. Components are built with ShadCN. State management and data fetching is handled with `tanstack/query`. It's built with async in mind.
It's completely headless and requires a RESTful-like API to work.

### API worker

API worker is a worker that implements a RESTful-like API. Its purpose is to act as a typical RESTful API; receiving requests and sending responses.
It only exists in the offline version of the application, and it's meant to bridge the architecture gap between an offline-first and online app.
Api worker defines a set of "endpoints", which look like this:

```ts
const serverRoutes = [
  {
    method: 'GET',
    path: '/server',
    handler: getServer,
  },
];
```

These endpoints mimic traditional RESTful API endpoints. We then implement a custom fetcher function.
This fetcher function follows the specification of the native `fetch` function (and just is the native `fetch` function in an online version of the app).
Thus, by changing the fetcher, we're able to connect to different data providers (api-worker in offline version and an actual backend in online version).

Example of the fetcher function used by the offline app:

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

In an online version of the app, this would be the native `fetch` function.

**Relevant files**:
- https://github.com/jurerotar/Pillage-First-Ask-Questions-Later/blob/master/app/(game)/providers/api-provider.tsx
- https://github.com/jurerotar/Pillage-First-Ask-Questions-Later/blob/master/app/(game)/utils/worker-fetch.ts

#### How it all works together

In the offline version of the app, there is no server. Everything happens exclusively on your device.
But, to allow the same codebase to work with an online version with minimal required changes, we can't just simply manipulate data on the frontend.
For this reason, we implemented the API worker.

When a user opens a game world, the app spawns a new worker and runs the API worker script on it. The purpose of this
worker is to act as an RESTful API. It exposes required REST API endpoints, queries and writes to the database, posts responses through
message
ports, acts as a WebSocket server,.... It essentially provides a service you'd typically expect from a fully-fledged backend. This allows
the frontend to be truly headless, making it integratable by both offline and online versions of the app. Frontend manipulates data only through this worker and no other data is persisted otherwise.

This design does complicate the codebase for the offline-version of the application, but it's the only way to allow the headless nature of
the frontend. By simply changing the fetcher function, you are able to connect the frontend to a different data
source (e.g. actual backend for an online app), without having to touch rest of the frontend.

### Database

Offline version of the application does not use a traditional database.
Instead, game state is kept in `@tanstack/react-query`'s `QueryClient` object. There's a couple of reason for it, most important one being that initially, `react-query` with a persister plugin was the state-management and persistence solution used.
This means that all the state was already in this single object. When we began considering a rewrite of the application to allow for a future online version, a large part of the app state already existed in `QueryClient` and it would have been too cumbersome to rewrite all the state as well.
For this reason, as well as ease of use reasons, `react-query` was kept as a state management solution on both the frontend and the API worker.

We have tried a `SQLite` implementation was tried as a proof-of-concept and while it does work, it also requires a massive rewrite of the app.

While `react-query` may seem as an odd choice for a database (and it certainly is!), I argue it's good enough for now. It's widely used in
frontend development as such, it allows new
developers to pick it up quickly. If there's performance issues with its usage in the future, it can be partially/fully swapped with an
actual database (ex. SQLite).

### Architecture graph

```mermaid
graph TD
  A[App Frontend] -->|Adapter| B[API Worker]
  B -->|Fetches game data & events| C[In-Memory Database]
  B -->|Sends game state updates| D[OPFS]
  C -->|Persisted on state change| D
  D -->|Retrieves saved state| B
  B -->|Event Processing & State Updates| C
  A -->|User Interacts| B
```

### Important files

- [`api-worker.ts`](/app/(game)/api/workers/api-worker.ts)
- [`api-routes.ts`](/app/(game)/api/api-routes.ts)
- [`api-provider.tsx`](/app/(game)/providers/api-provider.tsx)

### How would a multiplayer integration look like?

Frontend expects a REST API and a WebSocket server. The list of expected routes is found in `api-routes.ts`. Request parameters and responses
are found in `app/(game)/api` folder. To integrate your own backend, you need to implement the API routes (e.g., fetching game state,
interacting with events) and WebSocket support. Once these routes are live, provide a `fetcher` function in the `api-provider.tsx`. This
function is typically a `fetch` function that connects the frontend to the backend. After this, the app will be fully connected to the
backend
for multiplayer functionality.

Optionally, you can remove the `app/(game)/api` folder from your fork, as it will no longer be needed when connecting to a real backend.

---

## 5. Deployment & CI/CD

- The project is hosted on **Netlify**, with separate environments for master and develop branches as well as separate builds per branch and
  PRs.
- **GitHub Actions** are set up for automated testing, type-checking, lint & format validation.
