import { ServerCard } from 'app/(public)/(index)/components/server-card';
import { useAvailableServers } from 'app/(public)/hooks/use-available-servers';
import type { Server } from 'app/interfaces/models/game/server';
import { Link } from 'react-router';
import { Text } from 'app/components/text';
import { Suspense } from 'react';
import { FaDiscord, FaGithub } from 'react-icons/fa6';

const ServerList = () => {
  const { availableServers } = useAvailableServers();

  return (
    <section className="flex flex-col gap-2 w-full">
      <Link
        to="/create-new-server"
        className="w-full h-20 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center text-gray-700 hover:border-gray-600 hover:text-gray-700 transition"
      >
        Create a new game world
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
                <FaDiscord className="text-2xl md:text-3xl text-white" />
                <span className="flex font-semibold text-white">
                  Join the Discord server
                </span>
              </a>
              <a
                href="https://github.com/jurerotar/Pillage-First-Ask-Questions-Later"
                className="flex items-center justify-center gap-2 rounded-full bg-[#24292e] w-fit shadow-md p-2 px-4"
              >
                <FaGithub className="text-2xl md:text-3xl text-white" />
                <span className="flex font-semibold text-white">
                  Star on GitHub
                </span>
              </a>
            </div>
            <div className="hidden lg:flex">
              <div className="flex flex-col gap-2">
                <Text
                  as="h2"
                  className="underline"
                >
                  Motivation
                </Text>
                <Text>
                  I've always been a huge fan of Travian and similar
                  browser-based strategy games. The slow, methodical
                  village-building, resource management, and real-time
                  progression made those games special.
                  <br />
                  <br />
                  Sadly, Travian requires a massive time (and gold!) investment
                  to remain competitive. Not being able to commit either of
                  these, I set out to create a similar, but less
                  commitment-hungry experience.
                  <br />
                  <br />
                  Pillage First! is my attempt to recreate that experience as a
                  single-player Travian alternative, with the same core
                  mechanics, but modernized, offline-friendly, and fully open
                  source, with no game mechanics to incentivize spending
                  real-world money. Just the classic gameplay loop, reimagined
                  for solo play.
                </Text>
              </div>
            </div>
          </section>
          <section className="flex flex-col gap-4 mt-4 lg:mt-0 flex-1">
            <Text
              as="h2"
              className="font-semibold"
            >
              Existing game worlds
            </Text>
            <Text>
              Create a new game world or enter a previously created one
            </Text>
            <Suspense fallback={null}>
              <ServerList />
            </Suspense>
            <div className="flex lg:hidden">
              <div className="flex flex-col gap-2">
                <Text
                  as="h2"
                  className="underline"
                >
                  Motivation
                </Text>
                <Text>
                  I've always been a huge fan of Travian and similar
                  browser-based strategy games. The slow, methodical
                  village-building, resource management, and real-time
                  progression made those games special.
                  <br />
                  <br />
                  Sadly, Travian requires a massive time (and gold!) investment
                  to remain competitive. Not being able to commit either of
                  these, I set out to create a similar, but less
                  commitment-hungry experience.
                  <br />
                  <br />
                  Pillage First! is my attempt to recreate that experience as a
                  single-player Travian alternative, with the same core
                  mechanics, but modernized, offline-friendly, and fully open
                  source, with no game mechanics to incentivize spending
                  real-world money. Just the classic gameplay loop, reimagined
                  for solo play.
                </Text>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
};

export default HomePage;
