# Pillage First! (Ask Questions Later)

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
- `locales` → Localizations

# Contributing

All contributions are welcome at Pillage First!, whether they be tech, game design, localization or art related. Here are some guidelines to get you started:

- The style guide is enforced through tests and linting.
- We suggest adding tests to Pull Requests. Tests are typically colocated next to the code they're covering.
- Check the following documentation links:
  - [Architecture & app lifecycle](/docs/ARCHITECTURE.md)
  - [Directory naming convention](/docs/DIRECTORY_NAMING_CONVENTION.md)
- [Join Discord and ask for help](https://discord.gg/Ep7NKVXUZA) if you run into issues.

All contributions are greatly appreciated.

# Q&A

### Why single player?

There's multiple reasons, I want to expand on the 2 main ones.

First one is the scope of the project. In current state, the app is already tens of thousands of lines of code large, and it's nowhere near
completion. Adding a fully fledged backend to it would easily double the scope, making the project virtually undeliverable for a solo
developer doing this in my free time.

The second reason is personal: a frontend-only app of this scale and complexity is a unique challenge. I wanted to see how far I could push
it and tackle issues you rarely get to encounter "in the wild". This project lets me take on that challenge.

### Can this project be converted to multiplayer?

The broader vision for this project (assuming everything aligns **really**, **really** perfectly) is to eventually support both
single-player and multiplayer modes from the same app. The frontend is being built with this in mind, so the project could later accommodate
a full backend to enable multiplayer while still supporting single-player.

There are of course differences between single-player and multiplayer from a game design perspective, but those differences are small enough
to not really warrant building a completely separate application, in my opinion.

If you're passionate about backend development and interested in helping to get the multiplayer up and running, let's get in touch!

### Are there game design differences between Travian and Pillage First!?

Yes, there's a couple. The list isn't definitive and will definitely change as the app develops further, but here are the main ones:

* Culture points & town hall have been removed
* Unit upgrades are shared between villages
* Smithy has been removed (unit upgrade has been moved to Academy)
* Embassy & Stonemason buildings have been removed
* New building are planned to be added (Mercenary camp, Terrain shaper,...)
* New playable tribes

All of these changes are discussed in detail in our [Discord server](https://discord.gg/Ep7NKVXUZA), so feel free to join if you'd like to
learn more or give your opinion!

# More information

Check out these links to learn more about Pillage First!:

- [Join us on Discord](https://discord.gg/Ep7NKVXUZA)
