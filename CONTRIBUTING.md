# Contributing to Pillage First, Ask Questions Later

Thanks for considering contributing to **Pillage First, Ask Questions Later**!

Please read the following guidelines before making a contribution.

In case you have any questions, feel free
to [open a GitHub issue](https://github.com/jurerotar/Pillage-First-Ask-Questions-Later/issues/new/choose), or post your
question to the [Discord server](https://discord.gg/Ep7NKVXUZA).

## 1. License Agreement

This project is licensed under the GNU Affero General Public License v3.0.
By contributing to this repository, you agree that your contributions will be licensed under the terms of the project
license.

See the [LICENSE.md](/LICENSE.md) or https://gnu.org/licenses/agpl-3.0 for details.

## 2. Repository

This repository is set up as a monorepo with [Turborepo](https://turborepo.com).
It currently consists of the following apps & packages:

- **apps**
-
  - web (frontend client)

- **packages**
-
  - api (worker-based backend)
-
  - db (database schemas, migrations & seeders)
-
  - game-assets (game object definitions (buildings, units, ...))
-
  - mocks (mocks used in tests)
-
  - utils (shared helper functions)

### 2.1

On install, a `postinstall` hook runs `postinstall` currently does two things:

- Creates a `schema.sql` file inside `node_modules/@pillage-first/dev`. This file contains all table schemas + indexes.
  This is useful because you can feed whole schema to an AI of your choice, and it helps it write good queries. You can
  trigger the rebuild of `schema.sql` file by running `npm run create-dev-db`.

- Takes the contents of `@pillage-first/graphics` package and copies it in to `web` app's `public` folder. This is
  required because images are served from `public` folder.

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

## 5. Contribution guide

Before starting, please read through the [architecture documentation](./docs/ARCHITECTURE.md) to gain an understanding
on how the app works.

**Pillage First, Ask Questions Later** requires [Node.js version 24.12.0 (LTS)](https://nodejs.org/en/download) or
later.

1. Fork the project
2. Clone the forked project
3. Run `npm install` at the root of the repository
4. Run `turbo run dev` at the root of the repository

A development server will now start, and the app will be available on `http://localhost:5173`. A link to it will also be
posted to your terminal.

Implement your changes, then create a pull request against the original repository's `master` or `develop` branches.

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

