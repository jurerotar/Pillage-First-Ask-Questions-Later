# Echoes of Travian

<p style="display: flex; gap: 5px; flex-wrap: wrap">
  <img src="https://github.com/jurerotar/echoes-of-travian/actions/workflows/master-ci.yml/badge.svg" alt="master branch CI">
  <img src="https://github.com/jurerotar/echoes-of-travian/actions/workflows/develop-ci.yml/badge.svg" alt="develop branch CI">
  <img src="https://img.shields.io/netlify/d5146a5a-0a15-4619-bf86-a5c7552b406f" alt="Netlify">
  <img src="https://img.shields.io/badge/contributions-welcome-brightgreen" alt="Contributions">
</p>

Echoes of Travian is a single-player, real-time, browser-based strategy game, based on and inspired by Travian. It's browser based and requires no downloads or account creation.
Using browser's native IndexedDb, game data is persisted and progressed between game sessions, just like you would expect from an online game.

**Note: Very much still work in progress, not much to see at the moment.**


## Game design differences between Travian and Echoes of Travian

- Smithy upgrades are account-wide. Upgrading units in one village will upgrade them globally.
- Hero bonuses are account-wide. Applies to attack bonus, defence bonus as well as resource production.
- Hero production bonus is percentage based (up to 20%).
- Culture points removal. Make as many villages as you want, whenever you can afford them.
- Removal of town hall.
- Natars & nature as playable tribes.
- NPC factions, faction reputation system which determines trading options & hostility.
- 8 account-wide artifacts.

## Built with

- [React.js](https://react.dev) - The library for web and native user interfaces.
- [TypeScript](https://www.typescriptlang.org) - TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.
- [Tailwind CSS](https://tailwindcss.com) - A utility-first CSS framework packed with classes that can be composed to build any design, directly in your markup.
- [Vite.js](https://vitejs.dev) - Next generation frontend tooling.
- [React Router](https://reactrouter.com) - React Router enables "client side routing".
- [TanStack Query](https://tanstack.com/query/latest/) - Powerful asynchronous state management for TS/JS, React, Solid, Vue and Svelte.

## Installation guide

```sh
# clone the project
git clone https://github.com/jurerotar/Echoes-of-Travian.git

# Install dependencies
npm install

# Starts a development server with hot-reloading
npm run dev
```

## Documentation and references

- [Directory naming convention](/docs/DIRECTORY_NAMING_CONVENTION.md)

## License

[CC BY-NC 4.0 DEED - Attribution-NonCommercial 4.0 International](https://creativecommons.org/licenses/by-nc/4.0/)
