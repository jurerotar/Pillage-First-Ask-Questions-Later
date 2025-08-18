import { ServerCard } from 'app/(public)/(index)/components/server-card';
import { useAvailableServers } from 'app/hooks/use-available-servers';
import type { Server } from 'app/interfaces/models/game/server';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import { Suspense } from 'react';
import { FaDiscord, FaPlus, FaGithub } from 'react-icons/fa6';

const ServerList = () => {
  const { t } = useTranslation('public');
  const { availableServers } = useAvailableServers();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Text
          as="h3"
          className="text-base sm:text-lg font-semibold text-gray-800"
        >
          {t('Existing game worlds')}
        </Text>
        {availableServers.length === 0 ? (
          <Text className="text-gray-600 text-xs sm:text-sm">
            {t('No game worlds found. Create your first world to get started!')}
          </Text>
        ) : (
          <Text className="text-gray-600 text-xs sm:text-sm">
            {t('Select from your existing worlds')}
          </Text>
        )}
      </div>

      <div className="flex flex-col gap-3 max-h-64 sm:max-h-80 overflow-y-auto">
        {availableServers.map((server: Server) => (
          <ServerCard
            key={server.id}
            server={server}
          />
        ))}
      </div>
    </div>
  );
};

const HomePage = () => {
  const appVersion = import.meta.env.VERSION || '0.0.11';

  return (
    <>
      <title>Pillage First! (Ask Questions Later)</title>

      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
        {/* Header Section */}
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src="/web-app-manifest-192x192.png"
                  alt="Pillage First! Logo"
                  className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12"
                />
                <div className="text-center sm:text-left">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                    PILLAGE FIRST!
                  </h1>
                  <span className="text-xs sm:text-sm text-gray-500 font-medium">
                    v{appVersion}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <a
                  href="https://github.com/jurerotar/Pillage-First-Ask-Questions-Later"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors rounded-md hover:bg-gray-100"
                  title="GitHub Repository"
                >
                  <FaGithub className="text-lg" />
                  <span className="hidden sm:inline">GitHub</span>
                </a>
                <a
                  href="https://discord.gg/Ep7NKVXUZA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors rounded-md hover:bg-gray-100"
                  title="Join Discord"
                >
                  <FaDiscord className="text-lg" />
                  <span className="hidden sm:inline">Discord</span>
                </a>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
            {/* Hero Section - Left Column */}
            <div className="xl:col-span-2 space-y-6 lg:space-y-8">
              {/* Main Hero */}
              <section className="text-center xl:text-left">
                <div className="bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent mb-4">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">
                    Build your empire!
                  </h2>
                  <p className="text-lg sm:text-xl lg:text-2xl font-medium">
                    ...alone or with friends
                  </p>
                </div>

                {/* Game Screenshots Carousel */}
                <div className="my-6 lg:my-8">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                    <div className="aspect-square bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center border border-yellow-300 overflow-hidden">
                      <img
                        src="/graphic-packs/default-graphic-pack/buildings/resources/wheat-10.avif"
                        alt="Wheat Farm"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="aspect-square bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center border border-orange-300 overflow-hidden">
                      <img
                        src="/graphic-packs/default-graphic-pack/buildings/resources/clay-10.avif"
                        alt="Clay Pit"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border border-gray-300 overflow-hidden">
                      <img
                        src="/graphic-packs/default-graphic-pack/buildings/resources/iron-10.avif"
                        alt="Iron Mine"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="aspect-square bg-gradient-to-br from-green-100 to-green-200 rounded-lg items-center justify-center border border-green-300 overflow-hidden hidden sm:flex">
                      <img
                        src="/graphic-packs/default-graphic-pack/buildings/resources/wheat-16.avif"
                        alt="Granary"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2 lg:mt-3">
                    Resource buildings from the game
                  </p>
                </div>
              </section>

              {/* Main Actions */}
              <section className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center xl:justify-start">
                <Link
                  to="/create-new-server"
                  className="flex-1 sm:flex-none"
                >
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold px-6 sm:px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <FaPlus className="mr-2" />
                    CREATE WORLD
                  </Button>
                </Link>

                <a
                  href="https://discord.gg/Ep7NKVXUZA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none"
                >
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto border-2 border-indigo-600 text-indigo-600 hover:bg-blue-50 hover:border-indigo-700 hover:text-indigo-700 font-semibold px-6 sm:px-8 py-3 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <FaDiscord className="mr-2" />
                    JOIN DISCORD
                  </Button>
                </a>
              </section>

              {/* Game Description - Desktop */}
              <section className="hidden lg:block space-y-6">
                <div className="bg-white rounded-lg p-6 shadow-sm border">
                  <Text className="text-gray-700 leading-relaxed">
                    <strong>Pillage First! (Ask Questions Later)</strong> is an{' '}
                    <strong>in-development</strong>,{' '}
                    <strong>open-source</strong>,{' '}
                    <strong>single-player strategy game</strong> inspired by{' '}
                    <strong>Travian</strong>.
                    <br />
                    <br />
                    <strong>Build villages</strong>,{' '}
                    <strong>manage resources</strong>,{' '}
                    <strong>train troops</strong>, and wage war in{' '}
                    <strong>persistent</strong>, <strong>massive</strong>,{' '}
                    <strong>offline-first</strong> game worlds.
                  </Text>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-6 shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 underline">
                      Motivation
                    </h3>
                    <Text className="text-gray-700 text-sm leading-relaxed">
                      I've always been a huge fan of Travian and similar
                      browser-based strategy games. The slow, methodical
                      village-building, resource management, and real-time
                      progression made those games special.
                      <br />
                      <br />
                      <strong>Pillage First!</strong> is my attempt to recreate
                      that experience as a{' '}
                      <strong>single-player Travian alternative</strong>, with
                      the same core mechanics, but <strong>modernized</strong>{' '}
                      and <strong>fully open source</strong>.
                    </Text>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 underline">
                      Game Design Differences
                    </h3>
                    <Text className="text-gray-700 text-sm leading-relaxed">
                      Yes, there are some key differences. Main ones include new
                      buildings, more playable tribes, removal of capital
                      village mechanics, and new hero items.
                      <br />
                      <br />
                      Game design is always being discussed in{' '}
                      <a
                        rel="noopener noreferrer"
                        className="text-amber-500 underline hover:text-amber-700"
                        target="_blank"
                        href="https://discord.gg/Ep7NKVXUZA"
                      >
                        our Discord server
                      </a>
                      , so feel free to join the conversation!
                    </Text>
                  </div>
                </div>
              </section>
            </div>

            {/* Server Panel - Right Sidebar */}
            <div className="xl:col-span-1">
              <div className="bg-white rounded-lg shadow-lg border p-4 sm:p-6 sticky top-8">
                <Suspense
                  fallback={
                    <div className="animate-pulse space-y-3">
                      <div className="h-6 bg-gray-200 rounded" />
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-32 bg-gray-200 rounded" />
                    </div>
                  }
                >
                  <ServerList />
                </Suspense>
              </div>
            </div>

            {/* Mobile Game Description */}
            <div className="lg:hidden xl:col-span-3 space-y-4 sm:space-y-6">
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border">
                <Text className="text-gray-700 leading-relaxed text-sm sm:text-base">
                  <strong>Pillage First! (Ask Questions Later)</strong> is an{' '}
                  <strong>in-development</strong>, <strong>open-source</strong>,{' '}
                  <strong>single-player strategy game</strong> inspired by{' '}
                  <strong>Travian</strong>.
                  <br />
                  <br />
                  <strong>Build villages</strong>,{' '}
                  <strong>manage resources</strong>,{' '}
                  <strong>train troops</strong>, and wage war in{' '}
                  <strong>persistent</strong>, <strong>massive</strong>,{' '}
                  <strong>offline-first</strong> game worlds.
                </Text>
              </div>

              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 underline">
                    Motivation
                  </h3>
                  <Text className="text-gray-700 text-sm leading-relaxed">
                    I've always been a huge fan of Travian and similar
                    browser-based strategy games.
                    <strong>Pillage First!</strong> is my attempt to recreate
                    that experience as a{' '}
                    <strong>single-player Travian alternative</strong>.
                  </Text>
                </div>

                <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 underline">
                    Game Design Differences
                  </h3>
                  <Text className="text-gray-700 text-sm leading-relaxed">
                    New buildings, more playable tribes, and removal of capital
                    village mechanics. Game design is discussed in{' '}
                    <a
                      rel="noopener noreferrer"
                      className="text-blue-500 underline hover:text-blue-700"
                      target="_blank"
                      href="https://discord.gg/Ep7NKVXUZA"
                    >
                      our Discord
                    </a>
                    .
                  </Text>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default HomePage;
