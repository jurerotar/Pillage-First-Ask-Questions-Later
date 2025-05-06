# Pillage First! (Ask Questions Later)

Pillage First! (Ask Questions Later) is a single-player, open-source Travian clone. Real-time browser strategy game where you build
villages, manage resources, train troops and battle against your enemies. It supports fully-offline gameplay and persistence between sessions,
without requiring an internet connection or an account.

You can see the current stable version at: [pillagefirst.netlify.app](https://pillagefirst.netlify.app)

Remember: pillage first, ask questions later! ⚔️🔥

![Join our Discord server](https://img.shields.io/discord/1282804642807283842?style=flat&logo=discord&logoColor=white&label=Join%20our%20Discord%20server&labelColor=%235865F2)

> [!NOTE]
> Very much still work in progress.

<p align="center">
  <img src="/.github/assets/mobile-map-view.png" width="30%">
  &nbsp;
  <img src="/.github/assets/mobile-building-view.png" width="30%">
  &nbsp;
  <img src="/.github/assets/mobile-resources-view.png" width="30%">
</p>

# Motivation

I've always been a huge fan of Travian and similar browser-based strategy games. The slow, methodical village-building, resource management,
and real-time progression made those games special.

Pillage First! is my attempt to recreate that experience as a single-player Travian clone, with the same core mechanics — but modernized,
offline-friendly, and open source. No timers tied to servers, no competition — just the classic gameplay loop, reimagined for solo play.

### Why single player?

There are several reasons, but I’ll focus on the main ones.

The first is scope. Even in its current state, the app spans tens of thousands of lines of code — and it’s still far from complete. Adding a
full backend would effectively double the workload, making the project nearly impossible to finish as a solo developer working in their
spare time.

The second reason is personal. Building a complex frontend-only app at this scale is a unique challenge, and I wanted to see how far I could
push it. This project gives me the opportunity to explore problems you don’t usually encounter in typical frontend work.

### Can this project be converted to multiplayer?

The current goal is to keep this as a standalone, browser-only app focused entirely on single-player gameplay. That means there’s no backend
integration at the moment.

That said, the idea of converting it to multiplayer isn’t off the table. One of the hopes is that someone might eventually fork the project,
restructure it, and connect it to a backend. Most of the UI and core logic could be reused, making the transition easier than starting from
scratch.

If you’re passionate about backend development and want to help bring multiplayer to life — feel free to reach out!

### Are there game design differences between Travian and Pillage First!?

Yes, there's a couple. Game design is still being discussed in our [Discord server](https://discord.gg/Ep7NKVXUZA), so feel free to join if
you'd like to learn more or give your opinion!

# Roadmap

See the [ROADMAP.md](/docs/ROADMAP.md) for a full list of supported & upcoming features

## Development setup

Pillage First! requires [Node.js version 22.15.0 (LTS)](https://nodejs.org/en/download) or later.

```bash
# Install dependencies
npm install

# Starts a development server with hot-reloading
npm run dev
```

App will automatically open in your default browser at `localhost:5173`.

# Contributing

All contributions to **Pillage First! (Ask Questions Later)** are welcome — whether you're into development, game design, writing, or localization.

If you're interested in helping out, the best place to start is by [joining our Discord server](https://discord.gg/Ep7NKVXUZA). Introduce yourself, and we’ll figure out where you can contribute most effectively.

Here are a few ways you can get involved:

- Star the project on GitHub to support visibility
- Share ideas, feedback, or suggestions
- Tackle open issues or submit your own
- Contribute code, assets, or translations
- Ask questions — curiosity helps shape the project

Thanks for your interest! Every bit of input helps make the game better.

# License

This project is licensed under the GNU Affero General Public License v3.0.

See the [LICENSE.md](/LICENSE.md) or https://gnu.org/licenses/agpl-3.0 for details.
