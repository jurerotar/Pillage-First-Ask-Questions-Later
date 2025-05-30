# Architecture Documentation for `Pillage First, Ask Questions Later`

## 1. Introduction

This document provides an overview of the architecture, structure, and key technologies used in the development of the **Pillage First, Ask
Questions Later** game. It covers some implementation details, notes important files and describes application lifecycle.

---

## 2. Technology Stack

- **Frontend:** [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org/)
- **State Management:** [React Query](https://tanstack.com/query/latest)
- **UI Framework:** [Tailwind CSS](https://tailwindcss.com)
- **Routing:** [React Router v7 - framework mode](https://reactrouter.com)
- **Build System:** [Vite](https://vitejs.dev)
- **Format and lint:** [Biome.js](https://biomejs.dev)
- **Localization:
  ** [i18next](https://www.i18next.com) + [react-i18next](https://react.i18next.com) + [i18next-parser](https://github.com/i18next/i18next-parser)
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
│   │   ├── workers         # Server creation workers
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

## 4. Game lifecycle

The app consists of 3 separate logic layers:

- Frontend
- API worker
- In-memory database

### Frontend

Frontend is built with React and TypeScript. Components are built with ShadCN. It handles fetching data, showing loading states and
displaying data once it's ready.
It's completely headless and requires a RESTful API to work.

### API worker

Frontend receives data and sends actions through an `adapter`. `adapter` is a React context, which exposes a `fetcher` function. `fetcher`
function is how frontend communicates to the backend of your choice.

In the offline version of the app, there is no server. Everything happens exclusively on your device. Due to there being no backend, but
frontend still expecting a RESTful-like API, we implement a new solution.

When a user opens a game world, the app initializes an `api-worker`. The purpose of this
worker is to act as an RESTful API. It exposes required REST API endpoints, queries and writes to the database, posts responses through
message
ports, acts as a WebSocket server,.... It essentially provides a service you'd typically expect from a fully-fledged backend. This allows
the frontend to be truly headless, making it integratable by both offline and online versions of the app.

This design does complicate the codebase for the offline-version of the application, but it's the only way to allow the headless nature of
the frontend. By simply changing the `adapter`, you are able to connect the frontend to a different data
source (e.g. actual backend for an online app), without having to touch rest of the frontend.

### Database

Offline version of the application does not use a traditional database. While a `SQLite` implementation was tried as a proof-of-concept and
does work, to enable a faster workflow and enable a faster onboarding for new contributors, who are more likely to be a frontend developers,
due to the nature of this project, it's not currently used.

Instead, game state is kept in `@tanstack/react-query`'s `QueryClient` object. On any change to the object, data is persisted to browser's
OPFS storage.

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
