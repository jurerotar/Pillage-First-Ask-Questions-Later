# Pillage First! (Ask Questions Later)

Pillage First! (Ask Questions Later) is an **open-source**, **single-player** **strategy game** inspired by Travian.

Build villages, manage resources, train troops, and wage war in **persistent**, **massive**, **offline-first** game
worlds. It requires no account or
download.

Game mechanics are inspired by both Travian Legends and Travian Kingdoms. It's designed to be as light-weight as
possible, giving you a
great experience even on older devices. It is not a Travian clone per se, because it iterates on the original design and
introduces new
features.

You can see the current stable version at: [pillagefirst.netlify.app](https://pillagefirst.netlify.app)

Remember: pillage first, ask questions later! ⚔️🔥

![Join our Discord server](https://img.shields.io/discord/1282804642807283842?style=flat&logo=discord&logoColor=white&label=Join%20our%20Discord%20server&labelColor=%235865F2)

> [!NOTE]
> Very much still work in progress.

<p align="center">
  <img src="/.github/assets/mobile-map-view.png" width="30%">
  &nbsp;
  <img src="/.github/assets/mobile-building-construction-list.png" width="30%">
  &nbsp;
  <img src="/.github/assets/mobile-resources-view.png" width="30%">
</p>

# Motivation

I've always been a huge fan of Travian and similar browser-based strategy games. The slow, methodical village-building,
resource management,
and real-time progression made those games special.

Sadly, Travian requires a massive time (and gold!) investment to remain competitive. Not being able to commit either of
these, I set out to
create a similar, but less commitment-hungry experience.

**Pillage First!** is my attempt to recreate that experience as a **single-player Travian alternative**, with the same
core mechanics, but
modernized,
**offline-friendly**, and **fully open source**, with no game mechanics to incentivize spending real-world money. Just
the classic gameplay
loop,
reimagined for solo play.

### Can this project be converted to multiplayer?

**Yes!** This project was actually rebuilt from the ground up to make it as compatible as possible with a potential
backend integration.
You can find more technical details on how the app works and how a backend integration might look like
in [ARCHITECTURE.md](/docs/ARCHITECTURE.md).

That being said, the current goal is to keep this repository as a standalone, offline-first app focused on single-player
gameplay.

One of the hopes for the future of this project is that someone might eventually fork the project, restructure it, and
connect it to a
backend, enabling a multiplayer experience. Most of the frontend can be completely reused, making the transition easier
than starting from
scratch.

If you’re passionate about backend development and want to help bring multiplayer to life — feel free to reach out!

### Why single-player?

There are a few key reasons I chose to focus on single-player:

- **Moderation cost & complexity** - multiplayer comes with a whole layer of moderation challenges — things like chat
  filters, reporting tools, cheat
  prevention, and account systems. They’re not just one-time features either; they need constant upkeep and care. For a
  solo developer, that’s a massive investment of time and energy that could easily overshadow the actual game
  development. With single-player, I can skip all of that and stay focused on building the experience itself.


- **Offline-first accessibility** - by skipping networking, the game becomes fully
  playable offline. This makes it more
  accessible to players with limited or unreliable internet access, and ensures the experience is consistent regardless
  of connection quality.


- **Frontend challenge** - building a rich, complex app entirely in the browser is a rare and rewarding challenge. It
  pushes me to solve problems
  like state management, simulation, and performance, all within the constraints of a browser environment.

### Are there game design differences between Travian and Pillage First!?

Yes, there are a few! The main ones include new buildings, additional playable tribes, the removal of the capital
village mechanic, and new hero items. Game design is an ongoing conversation in
our [Discord server](https://discord.gg/Ep7NKVXUZA), so feel free to hop in and share your thoughts!

### Why not stick with the original?

While I love Travian, I (and many more like me) just don't have the time to commit to it
anymore. Pulling all-nighters, finding duals from across the world and making sure account is covered 24/7 was fun in
middle school, but it's not something I want to (or even can?) engage in now. I want to be able to take a break,
whenever life gets in the way, and for the game to respect that.

I want this game to be a more accessible, customizable and time-friendly version of Travian.

# Roadmap

See the [ROADMAP.md](/docs/ROADMAP.md) for a full list of supported & upcoming features.

# Contributing

All contributions to **Pillage First! (Ask Questions Later)** are welcome! We're always on the lookout for contributors
in development, game
design and UI/UX design.

> [!WARNING]
> We currently only accept localization changes for the English language.

Please refer to the [contribution guide](./CONTRIBUTING.md) for more information.

If this project interests you, we welcome you to join our [Discord server](https://discord.gg/Ep7NKVXUZA) and say hi!

Other ways to help the project are:

- Starring and forking the project on GitHub.
- Sharing ideas, feedback, or suggestions either on GitHub issue tracker, or in Discord.
- Asking questions. Your interest helps us shape the game faster and better.

Thanks for your interest!

# License

This project is licensed under the GNU Affero General Public License v3.0.

See the [LICENSE.md](/LICENSE.md) or https://gnu.org/licenses/agpl-3.0 for details.
