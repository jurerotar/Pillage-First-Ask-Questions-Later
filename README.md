# Echoes of Travian

Echoes of Travian is a single-player, real-time, browser-based strategy game, inspired by Travian.

It requires no download or account creation.

The game leverages browser-native technologies to save your progress and data between sessions, offering an experience akin to an online game.

> [!NOTE]
> Very much still work in progress.

## Setup

Echoes of Travian requires [Node.js](https://nodejs.org/en/download/package-manager) version 20 or higher.

```bash
# Install dependencies
npm install

# Starts a development server with hot-reloading
npm run dev
```

App will automatically open in your default browser at `localhost:5173`.

## Documentation

The codebase is split into following directories:

- `app` → Source code
- `docs` → Documentation
- `graphics` → Custom SVG icons used in the app
- `locales` → Localizations
- `public/images` → Graphic packs

# Contributing

All contributions are welcome at Echoes of Travian, whether they be tech, game design, localization or art related. Here are some guidelines to get you started:

- The style guide is enforced through tests and linting.
- We suggest adding tests to Pull Requests. Tests are typically colocated next to the code they're covering.
- Check the following documentation links:
  - [Architecture & app lifecycle](/docs/ARCHITECTURE.md)
  - [Directory naming convention](/docs/DIRECTORY_NAMING_CONVENTION.md)
- [Join Discord and ask for help](https://discord.gg/KZsWW3Z8) if you run into issues.

We greatly appreciate contributions in the following areas:

- Bug fixes.
- AI improvements.
- New game features.
- Balancing improvements.
- Experimental technical explorations.
- Tests to cover untested functionality.
- Performance improvements to core data structures.
- Separation of concerns into smaller libraries that can be published on npm and consumed by other projects.

The following packages have already been published as a result of work on this project:
  - [opfs-mock](https://www.npmjs.com/package/opfs-mock)
  - [ts-seedrandom](https://www.npmjs.com/package/ts-seedrandom)

# More information

Check out these links to learn more about Echoes of Travian:

- [Join us on Discord](https://discord.gg/KZsWW3Z8)
