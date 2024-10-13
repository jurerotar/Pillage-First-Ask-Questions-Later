# Pillage First! <span style="font-size:20px">(Ask Questions Later)</span>

Pillage First! is a single-player, real-time, browser-based strategy game inspired by Travian.

Manage resources to construct buildings, train units, and wage war against your enemies.

Remember: pillage first, ask questions later! ⚔️🔥

> [!NOTE]
> Very much still work in progress.

## Setup

Pillage First! requires [Node.js](https://nodejs.org/en/download/package-manager) version 20 or higher.

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

All contributions are welcome at Pillage First!, whether they be tech, game design, localization or art related. Here are some guidelines to get you started:

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

Check out these links to learn more about Pillage First!:

- [Join us on Discord](https://discord.gg/KZsWW3Z8)
