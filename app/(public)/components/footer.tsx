import { Link } from 'react-router';
import { Text } from 'app/components/text';
import { FaDiscord, FaGithub } from 'react-icons/fa6';
import { env } from 'app/env';
import { useTranslation } from 'react-i18next';

export const Footer = () => {
  const { t } = useTranslation('public');

  return (
    <footer className="border-t mt-4">
      <div className="container max-w-7xl mx-auto grid gap-4 md:gap-8 py-6 lg:py-10 md:grid-cols-4 px-2">
        <div className="flex flex-col gap-2">
          <Link to="/">
            <img
              alt="Pillage First! logo"
              width="200"
              src="/pillage-first-logo-horizontal.svg"
            />
          </Link>
          <Text>
            {t(
              'Pillage First! is an open-source, single-player strategy game inspired by Travian. Build villages, manage resources, train troops, and wage war in persistent, massive, offline-first game worlds.',
            )}
          </Text>
        </div>

        <nav className="flex flex-col gap-2">
          <Text
            as="h3"
            className="font-medium uppercase text-xs text-gray-500"
          >
            {t('Game')}
          </Text>
          <ul className="flex flex-col gap-2">
            <li>
              <Link to="/game-worlds">
                <Text className="font-medium text-gray-800">
                  {t('My game worlds')}
                </Text>
              </Link>
            </li>
            <li>
              <Link to="/game-worlds/create">
                <Text className="font-medium text-gray-800">
                  {t('Create a new game world')}
                </Text>
              </Link>
            </li>
            <li>
              <Link to="/game-worlds/import">
                <Text className="font-medium text-gray-800">
                  {t('Import game world')}
                </Text>
              </Link>
            </li>
          </ul>
        </nav>

        <nav className="flex flex-col gap-2">
          <Text
            as="h3"
            className="font-medium uppercase text-xs text-gray-500"
          >
            {t('Resources')}
          </Text>
          <ul className="flex flex-col gap-2">
            <li>
              <Link to="/frequently-asked-questions">
                <Text className="font-medium text-gray-800">
                  {t('Frequently asked questions')}
                </Text>
              </Link>
            </li>
            <li>
              <Link to="/get-involved">
                <Text className="font-medium text-gray-800">
                  {t('Get involved')}
                </Text>
              </Link>
            </li>
            <li>
              <Text className="font-medium text-gray-800">
                {t('Wiki (coming soon)')}
              </Text>
            </li>
          </ul>
        </nav>

        <nav className="flex flex-col gap-2">
          <Text
            as="h3"
            className="font-medium uppercase text-xs text-gray-500"
          >
            {t('Social')}
          </Text>
          <ul className="flex flex-wrap gap-2">
            <li>
              <a
                href="https://discord.gg/Ep7NKVXUZA"
                rel="noopener"
                className="flex items-center justify-center gap-2 rounded-full bg-[#7289da] shadow-md p-2"
              >
                <FaDiscord className="text-2xl md:text-3xl text-white" />
              </a>
            </li>
            <li>
              <a
                href="https://github.com/jurerotar/Pillage-First-Ask-Questions-Later"
                className="flex items-center justify-center gap-2 rounded-full bg-[#24292e] shadow-md p-2"
              >
                <FaGithub className="text-2xl md:text-3xl text-white" />
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t">
        <div className="max-w-7xl mx-auto flex flex-col gap-2 py-4 md:py-6 md:flex-row md:items-center md:justify-between px-2">
          <p className="text-xs text-muted-foreground">
            {t('Not affiliated with Travian Games GmbH.')}
          </p>
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">
              {t('App version')}: {env.VERSION}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('Commit ref')}: {(env.COMMIT_REF ?? '').substring(0, 8)}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('Branch')}: {env.HEAD}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
