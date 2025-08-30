import { ServerCard } from 'app/(public)/(index)/components/server-card';
import { useAvailableServers } from 'app/hooks/use-available-servers';
import type { Server } from 'app/interfaces/models/game/server';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Text } from 'app/components/text';
import { Suspense } from 'react';
import { FaDiscord, FaGithub } from 'react-icons/fa6';
import { Icon } from 'react-icons-sprite';

const FAQ = () => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Text
          as="h2"
          className="underline"
        >
          Motivation
        </Text>
        <Text>
          I've always been a huge fan of Travian and similar browser-based
          strategy games. The slow, methodical village-building, resource
          management, and real-time progression made those games special.
          <br />
          <br />
          Sadly, Travian requires a massive time (and gold!) investment to
          remain competitive. Not being able to commit either of these, I set
          out to create a similar, but less commitment-hungry experience.
          <br />
          <br />
          Pillage First! is my attempt to recreate that experience as a
          single-player Travian alternative, with the same core mechanics, but
          modernized, offline-friendly, and fully open source, with no game
          mechanics to incentivize spending real-world money. Just the classic
          gameplay loop, reimagined for solo play.
        </Text>
      </div>
      <div className="flex flex-col gap-2">
        <Text
          as="h2"
          className="underline"
        >
          Can this project be converted to multiplayer?
        </Text>
        <Text>
          <b>Yes!</b> This project was actually rebuilt from the ground up to
          make it as compatible as possible with a potential backend
          integration.
          <br />
          <br />
          That being said, the current goal is to keep this repository as a{' '}
          <b>standalone</b>, <b>offline-first</b> app focused on{' '}
          <b>single-player</b> gameplay.
          <br />
          <br />
          One of the hopes for the future of this project is that someone might
          eventually fork the project, restructure it, and connect it to a
          backend, enabling a multiplayer experience. Most of the frontend can
          be completely reused, making the transition easier than starting from
          scratch.
          <br />
          <br />
          If you’re passionate about backend development and want to help bring
          multiplayer to life — feel free to reach out!
        </Text>
      </div>
      <div className="flex flex-col gap-2">
        <Text
          as="h2"
          className="underline"
        >
          Why single-player?
        </Text>
        <Text>
          There are a few key reasons I chose to focus on single-player:
          <br />
          <br />
          <b>Moderation cost & complexity</b> - multiplayer comes with a whole
          layer of moderation challenges — things like chat filters, reporting
          tools, cheat prevention, and account systems. They’re not just
          one-time features either; they need constant upkeep and care. For a
          solo developer, that’s a massive investment of time and energy that
          could easily overshadow the actual game development. With
          single-player, I can skip all of that and stay focused on building the
          experience itself.
          <br />
          <br />
          <b>Offline-first accessibility</b> - by skipping networking, the game
          becomes fully playable offline. This makes it more accessible to
          players with limited or unreliable internet access, and ensures the
          experience is consistent regardless of connection quality.
          <br />
          <br />
          <b>Frontend challenge</b> - building a rich, complex app entirely in
          the browser is a rare and rewarding challenge. It pushes me to solve
          problems like state management, simulation, and performance, all
          within the constraints of a browser environment.
        </Text>
      </div>
      <div className="flex flex-col gap-2">
        <Text
          as="h2"
          className="underline"
        >
          Are there game design differences between Travian and Pillage First!?
        </Text>
        <Text>
          <b>Yes, there's a couple</b>. Main ones are new buildings, more
          playable tribes, removal of capital village mechanic and new hero
          items.
          <br />
          <br />
          Game design is always being discussed in{' '}
          <a
            rel="noopener noreferrer"
            className="text-blue-500 underline"
            target="_blank"
            href="https://discord.gg/Ep7NKVXUZA"
          >
            our Discord server
          </a>
          , so feel free to join if you'd like to join the conversation and
          share your opinion!
        </Text>
      </div>
      <div className="flex flex-col gap-2">
        <Text
          as="h2"
          className="underline"
        >
          Why not stick with the original?
        </Text>
        <Text>
          While I love Travian, I (and many more like me) just don't have the
          time to commit to it anymore. Pulling all-nighters, finding duals from
          across the world and making sure account is covered 24/7 was fun in
          middle school, but it's not something I want to (or even can?) engage
          in now. I want to be able to take a break, whenever life gets in the
          way, and for the game to respect that.
          <br />
          <br />I want this game to be a more <b>accessible</b>,{' '}
          <b>customizable</b> and <b>time-friendly</b> version of Travian.
        </Text>
      </div>
    </div>
  );
};

const ServerList = () => {
  const { t } = useTranslation('public');
  const { availableServers } = useAvailableServers();

  return (
    <section className="flex flex-col gap-2 w-full">
      <Link
        to="/create-new-server"
        className="w-full h-20 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center text-gray-700 hover:border-gray-600 hover:text-gray-700 transition"
      >
        {t('Create a new game world')}
      </Link>
      {availableServers.map((server: Server) => (
        <ServerCard
          key={server.id}
          server={server}
        />
      ))}
    </section>
  );
};

const HomePage = () => {
  const { t } = useTranslation('public');

  return (
    <>
      <title>Pillage First! (Ask Questions Later)</title>
      <main className="flex flex-col">
        <div className="container relative mx-auto flex min-h-[300px] flex-col lg:flex-row gap-2 px-2">
          <section className="flex flex-col gap-4 flex-1">
            <Text
              as="h1"
              className="font-semibold"
            >
              Pillage First! (Ask Questions Later)
            </Text>
            <Text>
              <b>Pillage First!</b> is an <b>open-source</b>,{' '}
              <b>single-player</b> strategy game <b>inspired by Travian</b>.
              <br />
              <br />
              <b>Build villages</b>, <b>manage resources</b>,{' '}
              <b>train troops</b>, and wage war in persistent, massive,{' '}
              <b>offline-first</b> game worlds. It requires no account or
              download.
            </Text>

            <div className="flex flex-col md:flex-row gap-2">
              <a
                href="https://discord.gg/Ep7NKVXUZA"
                rel="noopener"
                className="flex items-center justify-center gap-2 rounded-full bg-[#7289da] w-fit shadow-md p-2 px-4"
              >
                <Icon
                  icon={FaDiscord}
                  className="text-2xl md:text-3xl text-white"
                />
                <span className="flex font-semibold text-white">
                  Join the Discord server
                </span>
              </a>
              <a
                href="https://github.com/jurerotar/Pillage-First-Ask-Questions-Later"
                className="flex items-center justify-center gap-2 rounded-full bg-[#24292e] w-fit shadow-md p-2 px-4"
              >
                <Icon
                  icon={FaGithub}
                  className="text-2xl md:text-3xl text-white"
                />
                <span className="flex font-semibold text-white">
                  Star on GitHub
                </span>
              </a>
            </div>
            <div className="hidden lg:flex">
              <FAQ />
            </div>
          </section>
          <section className="flex flex-col gap-4 mt-4 lg:mt-0 flex-1">
            <Text
              as="h2"
              className="font-semibold"
            >
              {t('Existing game worlds')}
            </Text>
            <Text>
              {t('Create a new game world or enter a previously created one')}
            </Text>
            <Suspense fallback={null}>
              <ServerList />
            </Suspense>
            <div className="flex lg:hidden">
              <FAQ />
            </div>
          </section>
        </div>
      </main>
    </>
  );
};

export default HomePage;
