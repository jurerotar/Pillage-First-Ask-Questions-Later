import { ServerCard } from 'app/(public)/(index)/components/server-card';
import { useAvailableServers } from 'app/hooks/use-available-servers';
import type { Server } from 'app/interfaces/models/game/server';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Text } from 'app/components/text';
import { Suspense } from 'react';

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
    <main className="flex flex-col">
      <div className="container relative mx-auto flex min-h-[300px] flex-col gap-2 lg:flex-row">
        <section className="flex flex-1 flex-col gap-6 p-2">
          <Text
            as="h1"
            className="font-semibold"
          >
            Pillage First! (Ask Questions Later)
          </Text>
          <Text as="p">
            <b>Pillage First! (Ask Questions Later)</b> is an{' '}
            <b>in-development</b>, <b>open-source</b>,{' '}
            <b>single-player strategy game</b> inspired by <b>Travian</b>.
            <br />
            <br />
            <b>Build villages</b>, <b>manage resources</b>, <b>train troops</b>,
            and wage war in <b>persistent</b>, <b>massive</b>,{' '}
            <b>offline-first</b> game worlds.
          </Text>

          <div className="flex-col gap-4 hidden lg:flex">
            <div className="flex flex-col gap-2">
              <Text
                as="h2"
                className="underline"
              >
                Motivation
              </Text>
              <Text as="p">
                I've always been a huge fan of Travian and similar browser-based
                strategy games. The slow, methodical village-building, resource
                management, and real-time progression made those games special.
                <br />
                <br />
                Sadly, Travian requires a massive time (and gold!) investment to
                remain competitive. Not being able to commit either of these, I
                set out to create a similar, but less commitment-hungry
                experience.
                <br />
                <br />
                <b>Pillage First!</b> is my attempt to recreate that experience
                as a <b>single-player Travian alternative</b>, with the same
                core mechanics, but <b>modernized</b>, <b>offline-friendly</b>,
                and <b>fully open source</b>, with no game mechanics to
                incentivize spending real-world money. Just the{' '}
                <b>classic gameplay loop</b>, reimagined for <b>solo play</b>.
              </Text>
            </div>
            <div className="flex flex-col gap-2">
              <Text
                as="h2"
                className="underline"
              >
                Are there game design differences between Travian and Pillage
                First!?
              </Text>
              <Text as="p">
                Yes, there's a couple. Main ones are new buildings, more
                playable tribes, removal of capital village mechanic and new
                hero items.
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
                , so feel free to join if you'd like to join the conversation
                and share your opinion!
              </Text>
            </div>
          </div>
        </section>
        <section className="flex flex-1 flex-col p-2 gap-4">
          <Text
            as="h2"
            className="font-semibold"
          >
            {t('Existing game worlds')}
          </Text>
          <Text as="p">
            {t('Create a new game world or enter a previously created one')}
          </Text>
          <Suspense fallback={null}>
            <ServerList />
          </Suspense>
        </section>
        <section className="flex lg:hidden flex-col gap-2 p-2">
          <div className="flex-col gap-4 flex">
            <div className="flex flex-col gap-2">
              <Text
                as="h2"
                className="underline"
              >
                Motivation
              </Text>
              <Text as="p">
                I've always been a huge fan of Travian and similar browser-based
                strategy games. The slow, methodical village-building, resource
                management, and real-time progression made those games special.
                <br />
                <br />
                Sadly, Travian requires a massive time (and gold!) investment to
                remain competitive. Not being able to commit either of these, I
                set out to create a similar, but less commitment-hungry
                experience.
                <br />
                <br />
                <b>Pillage First!</b> is my attempt to recreate that experience
                as a <b>single-player Travian alternative</b>, with the same
                core mechanics, but <b>modernized</b>, <b>offline-friendly</b>,
                and <b>fully open source</b>, with no game mechanics to
                incentivize spending real-world money. Just the{' '}
                <b>classic gameplay loop</b>, reimagined for <b>solo play</b>.
              </Text>
            </div>
            <div className="flex flex-col gap-2">
              <Text
                as="h2"
                className="underline"
              >
                Are there game design differences between Travian and Pillage
                First!?
              </Text>
              <Text as="p">
                Yes, there's a couple. Main ones are new buildings, more
                playable tribes, removal of capital village mechanic and new
                hero items.
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
                , so feel free to join if you'd like to join the conversation
                and share your opinion!
              </Text>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default HomePage;
