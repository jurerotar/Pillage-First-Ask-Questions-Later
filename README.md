# Pillage First! (Ask Questions Later)

**Pillage First! (Ask Questions Later) is an open-source, single-player strategy game inspired by Travian.**
It's a **Travian alternative**, where you build villages, manage resources, train troops, and wage war, but in a **single-player** setting. It supports massive, **persistent**, **offline-first** game worlds. It requires no account or download.

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

**Pillage First!** is my attempt to recreate that experience as a **single-player Travian alternative**, with the same core mechanics, but modernized,
**offline-friendly**, and **open source**, with no game mechanics to incentivize spending real-world money. Just the classic gameplay loop, reimagined for solo play.

### Why single-player?

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

Yes, there's a couple. Main ones are new buildings, more playable tribes and new hero items. Game design is always being discussed in our [Discord server](https://discord.gg/Ep7NKVXUZA), so feel free to join if
you'd like to join the conversation and share your opinion!

# Roadmap

See the [ROADMAP.md](/docs/ROADMAP.md) for a full list of supported & upcoming features.

# Contributing

All contributions to **Pillage First! (Ask Questions Later)** are welcome! We're always on the lookout for contributors in development, game design, writing, or localization.
If this project interests you, we welcome you to join our [Discord server](https://discord.gg/Ep7NKVXUZA) and say hi!

Other ways to help the project are:

- Starring and forking the project on GitHub.
- Sharing ideas, feedback, or suggestions either on GitHub issue tracker, or in Discord.
- Asking questions. Your interest helps us shape the game faster and better.

Thanks for your interest!

## Development setup

Pillage First! requires [Node.js version 22.15.0 (LTS)](https://nodejs.org/en/download) or later.

```bash
# Install dependencies
npm install

# Starts a development server with hot-reloading
npm run dev
```

App will automatically open in your default browser at `localhost:5173`.

# License

This project is licensed under the GNU Affero General Public License v3.0.

See the [LICENSE.md](/LICENSE.md) or https://gnu.org/licenses/agpl-3.0 for details.
