# Contributing to Pillage First, Ask Questions Later

Thanks for considering contributing to **Pillage First, Ask Questions Later**!

Please read the following guidelines before making a contribution.

In case you have any questions, feel free to [open a GitHub issue](https://github.com/jurerotar/Pillage-First-Ask-Questions-Later/issues/new/choose), or post your question to the [Discord server](https://discord.gg/Ep7NKVXUZA).

## 1. License Agreement

This project is licensed under the GNU Affero General Public License v3.0.
By contributing to this repository, you agree that your contributions will be licensed under the terms of the project license.

See the [LICENSE.md](/LICENSE.md) or https://gnu.org/licenses/agpl-3.0 for details.

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

## 3. Project Structure and important files

The project follows a **colocation** principle, meaning files related to a feature (components, tests, hooks,... and utilities) are kept
close to each other within the same directory. This approach improves maintainability and makes it easier to find and modify related code.

**Keep related files together** – A component's styles, tests, and utilities should be in the same directory.

**Encapsulate logic per feature** – Features should have their own directory inside the app/ folder, containing its related components,
hooks, providers,... and tests.

Please refer to [directory naming convention](./docs/DIRECTORY_NAMING_CONVENTION.md) for naming convention.

```
├── .github                 # GitHub-specific configurations and workflows
├── .husky                  # Git hooks for enforcing code quality
├── app                     # Main application source code
│   ├── (design-system)     # Temporary route group allowing you to see a list of icons app uses (/design-system/icons)
│   ├── (game)              # Game-specific routes and assets
│   │   ├── (xxx)           # Game routes (/resources, /map,...)
│   │   ├── providers       # Game engine, game-state,... providers
│   │   ├── api             # Local-api
│   │   ├── assets          # Buildings, units, items, ... data
│   │   ├── layout.ts       # Game-only layout
│   │   ├── ...
│   ├── (public)            # Public pages (/, /create-new-server)
│   │   ├── layout.ts       # Public-pages only layout
│   │   ├── ...
│   ├── interfaces          # TypeScript interfaces and types
│   ├── localization        # Localization files
│   ├── styles              # Tailwind configuration and global stylesheets
│   ├── tests               # Unit test environments and mocks
│   ├── ...
│   ├── faro.ts             # Grafana Faro configuration file
│   ├── sw.ts               # Service worker entry file
│   ├── root.tsx            # Root entry point for the application
│   ├── routes.ts           # Application route definitions
│   ├── ...
├── docs                    # Project documentation
├── public                  # Static files served by the app (e.g., index.html)
├── scripts                 # Custom scripts for development and build automation
```

## 4. Contribution guide

Before starting, please read through the [architecture documentation](./docs/ARCHITECTURE.md) to gain an understanding on how the app works.

**Pillage First, Ask Questions Later** requires [Node.js version 22.18.0 (LTS)](https://nodejs.org/en/download) or later.

1. Fork the project
2. Clone the forked project
3. Run `npm install` at the root of the repository
4. Run `npm run dev` at the root of the repository

App will automatically open in your default browser at `http://localhost:5173`.

The latest work is always pushed to the `master` branch.

Implement your changes, then create a pull request against the original repository's `master` branch.

## 5. Git Hooks

We use git hooks to enforce consistent code standards and checks. Currently, 3 hooks are used:

`commit-msg`: Commit messages are validated with `commitlint`. We use the [default configuration](https://github.com/conventional-changelog/commitlint/tree/master/%40commitlint/config-conventional), without the body length check.

`pre-commit`: Lint, format and localization script are run.

`pre-push`: Lint, format and localization is validated before push.

These hooks are managed automatically via `husky`. You can find all scripts in `.husky` folder.

## 6. Localization

Localizations are added automatically with `i18next-parser` module. This script is run on commit.

## 7. GitHub Actions

GitHub Actions are used for CI/CD automation. We check linting, formatting, test status, localization status and TypeScript compiler errors.

Please refer to the `.github/workflows/` directory for details on each action.

## 8. Deployment & CI/CD

The project is hosted on **Netlify**, with separate environments for master branch and builds per branch and PRs.

