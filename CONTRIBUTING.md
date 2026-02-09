# Contributing to Pillage First, Ask Questions Later

Thanks for considering contributing to **Pillage First, Ask Questions Later**!

Please read the following guidelines before making a contribution.

In case you have any questions, feel free
to [open a GitHub issue](https://github.com/jurerotar/Pillage-First-Ask-Questions-Later/issues/new/choose), or post your
question to the [Discord server](https://discord.gg/Ep7NKVXUZA).

### License Agreement

This project is licensed under the GNU Affero General Public License v3.0.
By contributing to this repository, you agree that your contributions will be licensed under the terms of the project
license.

See the [LICENSE.md](/LICENSE.md) or https://gnu.org/licenses/agpl-3.0 for details.

## 1. Installation

**Pillage First, Ask Questions Later** requires [Node.js version 24.12.0 (LTS)](https://nodejs.org/en/download) or
later.

1. Fork the project
2. Clone the forked project
3. Run `npm install` at the root of the repository
4. Run `npm run inject-graphics` at the root of the repository
5. (Optional) If you cloned the repository before we migrated to a monorepo, you will have some orphaned directories
   sticking around. Run `npm run remove-deprecated-directories` command to remove these unneeded files.
6. (Optional) Run `npm run extract-sql-schema`, which generates a `schema.sql` file inside `node_modules/@pillage-first/dev` with all table
   definitions and indexes. Useful for giving context to AI when building queries.

## 2. Repository

This repository is set up as a monorepo with [Turborepo](https://turborepo.com).
It currently consists of the following apps & packages:

- **apps**
-
  - [web](/apps/web/README.md) (frontend client)

- **packages**
-
  - [api](/packages/api/README.md) (worker-based backend)
-
  - [db](/packages/db/README.md) (database schemas, migrations & seeders)
-
  - [game-assets](/packages/game-assets/README.md) (game object definitions (buildings, units, ...))
-
  - [mocks](/packages/mocks/README.md) (mocks used in tests)
-
  - [types](/packages/types/README.md) (shared types)
-
  - [utils](/packages/utils/README.md) (shared helper functions)

### 2.1 Useful scripts

- `npm run inject-graphics` - app graphics are stored in `@pillage-first/graphics` npm package. This commands takes the
graphic contents of `@pillage-first/graphics` and injects it to `apps/web/public`. This is required for graphics to be
displayed correctly.
- `npm run remove-deprecated-directories` - if you cloned the repository before we migrated to a monorepo, you will have
some orphaned directories sticking around. Run this command to remove these unneeded files.
- `npm run extract-sql-schema` - generates a `schema.sql` file inside `node_modules/@pillage-first/dev` with all table
definitions and indexes. Useful for giving context to AI when building queries.
- `npm run extract-sql-usage` - generates a `.sql` file inside `node_modules/@pillage-first/dev` with every SQL statement
the app currently uses. Useful for debugging performance & checking indexing.

## 3. Technology Stack

- **Repository:** [Turborepo](https://turborepo.com)
- **Frontend:** [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org/)
- **State Management:** [React Query](https://tanstack.com/query/latest)
- **UI Framework:** [Tailwind CSS](https://tailwindcss.com)
- **Routing:** [React Router v7 - framework mode](https://reactrouter.com)
- **Build System:** [Vite](https://vitejs.dev)
- **Format and lint:** [Biome.js](https://biomejs.dev)
- **Localization:**
  [i18next](https://www.i18next.com) + [react-i18next](https://react.i18next.com) + [i18next-cli](https://github.com/i18next/i18next-cli)
- **Unit testing:** [Vitest](https://vitest.dev)
- **Deployment:**
  Netlify ([Master Deploy](https://pillagefirst.netlify.app) | [Dev Deploy](https://develop--pillagefirst.netlify.app))
- **Version Control:** GitHub ([Repository](https://github.com/jurerotar/Pillage-First-Ask-Questions-Later))

## 4. Project Structure

The project follows a **colocation** principle, meaning files related to a feature (components, tests, hooks,... and
utilities) are kept
close to each other within the same directory. This approach improves maintainability and makes it easier to find and
modify related code.

## 5. Contributing

Before starting, please read through the [architecture documentation](./docs/ARCHITECTURE.md) to gain an understanding
on how the app works.

Run `turbo run dev` at the root of the repository to start a development server, and the app will be available on `http://localhost:5173`. A link to it will also be
posted to your terminal.

Implement your changes, then create a pull request against the upstream repository's `develop` branch.

Pull requests cannot be merged until all required checks are passing.

## 6. Git Hooks

We use git hooks to enforce consistent code standards and checks. Currently, 3 hooks are used:

`commit-msg`: Commit messages are validated with `commitlint`. We use
the [default configuration](https://github.com/conventional-changelog/commitlint/tree/master/%40commitlint/config-conventional),
without the body length check.

`pre-commit`: Lint, format and localization-extraction script are run.

`pre-push`: Lint and format is validated before push.

These hooks are managed automatically via `lefthook`. You can find the configuration in [
`lefthook.yml`](./lefthook.yml).

## 7. Localization

Inline localizations are added automatically with `i18next-cli` module. This script is run during `pre-commit`.

## 8. GitHub Actions

GitHub Actions are used for CI/CD automation. We check linting, formatting, test status, localization status and
TypeScript compiler errors.

Please refer to the `.github/workflows/` directory for details on each action.

You may run these checks locally.

- lint - `turbo run lint` or `turbo run lint:check`
- format - `turbo run format` or `turbo run format:check`
- typecheck - `turbo run type-check`
- test - `turbo run test`
- i18n check - `npx --workspace="web" i18next-cli extract --ci`

## 9. Deployment & CI/CD

The project is hosted on **Netlify**, with separate environments for master branch and builds per branch and PRs.
Posting a pull-request will automatically create a new live deployment.

