# Pillage First! (Ask Questions Later)

Pillage First! is a single-player, real-time, browser-based strategy game inspired by Travian.

Manage resources to construct buildings, train units, and wage war against your enemies.

Remember: pillage first, ask questions later! ⚔️🔥

> [!NOTE]
> Very much still work in progress.

<p align="center">
  <picture>
    <source media="(max-width: 768px)" srcset="/.github/assets/mobile-map-view.jpg">
    <img src="/.github/assets/mobile-map-view.jpg" width="40%">
  </picture>
  <picture>
    <source media="(max-width: 768px)" srcset="/.github/assets/mobile-building-view.jpg">
    <img src="/.github/assets/mobile-building-view.jpg" width="40%">
  </picture>
  <picture>
    <source media="(max-width: 768px)" srcset="" width="0%">
    <img src="/.github/assets/mobile-building-list-view.jpg" width="30%">
  </picture>
</p>

## Development setup

Pillage First! requires [Node.js version 22.14.0 (LTS)](https://nodejs.org/en/download) or later.

```bash
# Install dependencies
npm install

# Starts a development server with hot-reloading
npm run dev
```

App will automatically open in your default browser at `localhost:5173`.

# Contributing

All contributions are welcome at Pillage First!, whether they be tech, game design, localization or art related. Here are some guidelines to get you started:

- The style guide is enforced through tests and linting.
- We suggest adding tests to Pull Requests. Tests are typically colocated next to the code they're covering.
- Check the following documentation links:
  - [Architecture & app lifecycle](/docs/ARCHITECTURE.md)
  - [Directory naming convention](/docs/DIRECTORY_NAMING_CONVENTION.md)
- [Join Discord and ask for help](https://discord.gg/Ep7NKVXUZA) if you have questions or run into issues.

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

The current vision for this project is to become a browser-only, standalone app, allowing full single-player gameplay.
Because of this, it does not currently accommodate any backend integration. This does not mean the answer is no though.
One of the hopes for this project is that it would eventually be forked, reorganized and connected to a backend.
This would allow most of the UI to be reused between this app and the fork, reducing the amount of effort needed on the fork.

If you're passionate about backend development and interested in helping to get the multiplayer up and running, let's get in touch!

### Are there game design differences between Travian and Pillage First!?

Yes, there's a couple. The list isn't definitive and will definitely change as the app develops further, but here are the main ones:

* Culture points & town hall have been removed
* Unit upgrades are shared between villages
* Smithy has been removed (unit upgrade has been moved to Academy)
* Embassy & Stonemason buildings have been removed
* New building are planned to be added (Mercenary camp, Terrain shaper,...)
* New playable tribes
* New artifacts, all of them available from the start of the server

All of these changes are discussed in detail in our [Discord server](https://discord.gg/Ep7NKVXUZA), so feel free to join if you'd like to
learn more or give your opinion!

# More information

Check out these links to learn more about Pillage First!:

- [Join us on Discord](https://discord.gg/Ep7NKVXUZA)
