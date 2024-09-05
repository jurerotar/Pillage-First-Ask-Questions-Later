# Echoes of Travian

[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/jurerotar/echoes-of-travian/master-ci.yml?branch=master&logo=github&label=master%20ci)](https://echoes-of-travian.netlify.app)
[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/jurerotar/echoes-of-travian/master-ci.yml?branch=develop&logo=github&label=develop%20ci)](https://develop--echoes-of-travian.netlify.app)
![Netlify](https://img.shields.io/netlify/d5146a5a-0a15-4619-bf86-a5c7552b406f?logo=netlify)
[![GitHub discussions](https://img.shields.io/badge/GitHub%20discussions-Chat%20now!-blue)](https://github.com/jurerotar/Echoes-of-Travian/discussions/new/choose)
![Static Badge](https://img.shields.io/badge/Contributions-welcome-limegreen)

Echoes of Travian is a single-player, real-time, browser-based strategy game, inspired by Travian. It requires no download or account creation.
The game leverages browser-native technologies to save your progress and data between sessions, offering an experience akin to an online game.

[![Try live](https://img.shields.io/badge/Try%20live%20%20-%20open%20-%20limegreen)](https://echoes-of-travian.netlify.app)

> [!NOTE]
> Very much still work in progress, not much to see at the moment.

## Features

✅ Smithy upgrades are server-wide. Upgrading units in one village will upgrade them globally.<br>
✅ New artifacts.<br>
✅ Culture points removal. Make as many villages as you want, whenever you can afford them.<br>
✅ NPC factions, reputation system which determines trading options & hostility.<br>
✅ Natars & nature as playable tribes.<br>

## Development guide

### Tech stack
- [React.js](https://react.dev) - The library for web and native user interfaces.
- [TypeScript](https://www.typescriptlang.org) - TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.
- [Tailwind CSS](https://tailwindcss.com) - A utility-first CSS framework packed with classes that can be composed to build any design, directly in your markup.
- [Vite.js](https://vitejs.dev) - Next generation frontend tooling.
- [React Router](https://reactrouter.com) - React Router enables "client side routing".
- [TanStack Query](https://tanstack.com/query/latest/) - Powerful asynchronous state management for TS/JS, React, Solid, Vue and Svelte.
- [Biome](https://biomejs.dev) - Format, lint, and more in a fraction of a second.

### Installation guide

1. Install [Node.js v21](https://nodejs.org/en/download/prebuilt-installer) or higher.
2. Clone this repository.
3. Navigate to the project and run `npm i` to install the dependencies.
4. Run `npm run dev` to start the development server.
5. App will automatically open in your default browser

```sh
# clone the project
git clone https://github.com/jurerotar/Echoes-of-Travian.git

# Navigate to the project folder
cd Echoes-of-Travian

# Install dependencies
npm install

# Starts a development server with hot-reloading
npm run dev
```

## Documentation and references

- [Architecture & app lifecycle](/docs/ARCHITECTURE.md)
- [Directory naming convention](/docs/DIRECTORY_NAMING_CONVENTION.md)

## Security

[Security policy](/SECURITY.md)

## License

[CC BY-NC 4.0 DEED - Attribution-NonCommercial 4.0 International](https://creativecommons.org/licenses/by-nc/4.0/)
