import { use, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaDiscord, FaGithub } from 'react-icons/fa6';
import { Link } from 'react-router';
import type { UIColorScheme } from '@pillage-first/types/models/preferences';
import { env } from '@pillage-first/utils/env';
import { Text } from 'app/components/text';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'app/components/ui/select';
import { CookieContext } from 'app/providers/cookie-provider';
import { setCookie, UI_COLOR_SCHEME_COOKIE_NAME } from 'app/utils/device';

export const Footer = () => {
  const { t } = useTranslation('public');
  const { uiColorScheme } = use(CookieContext);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <footer className="border-t mt-4 pb-safe">
      <div className="container max-w-7xl mx-auto grid gap-4 md:gap-8 py-6 lg:py-10 md:grid-cols-4 px-2">
        <div className="flex flex-col gap-2 col-span-full md:col-span-1">
          <Link to="/">
            <img
              alt={t('Pillage First! logo')}
              width="200"
              height="30"
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
            as="span"
            className="font-medium uppercase text-xs text-muted-foreground"
          >
            {t('Game')}
          </Text>
          <ul className="flex flex-col gap-2">
            <li>
              <Link to="/game-worlds">
                <Text className="font-medium">{t('My game worlds')}</Text>
              </Link>
            </li>
            <li>
              <Link to="/game-worlds/create">
                <Text className="font-medium">
                  {t('Create a new game world')}
                </Text>
              </Link>
            </li>
            <li>
              <Link to="/game-worlds/import">
                <Text className="font-medium">{t('Import game world')}</Text>
              </Link>
            </li>
          </ul>
        </nav>

        <nav className="flex flex-col gap-2">
          <Text
            as="span"
            className="font-medium uppercase text-xs text-muted-foreground"
          >
            {t('Resources')}
          </Text>
          <ul className="flex flex-col gap-2">
            <li>
              <Link to="/frequently-asked-questions">
                <Text className="font-medium">
                  {t('Frequently asked questions')}
                </Text>
              </Link>
            </li>
            <li>
              <Link to="/get-involved">
                <Text className="font-medium">{t('Get involved')}</Text>
              </Link>
            </li>
            <li className="opacity-50">
              <Text className="font-medium">{t('Wiki (coming soon)')}</Text>
            </li>
            <li>
              <Link to="/latest-updates">
                <Text className="font-medium">{t('Latest updates')}</Text>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="flex flex-col gap-4">
          <nav className="flex flex-col gap-2">
            <Text
              as="span"
              className="font-medium uppercase text-xs text-muted-foreground"
            >
              {t('Community')}
            </Text>
            <ul className="flex flex-wrap gap-2">
              <li>
                <a
                  href="https://discord.gg/Ep7NKVXUZA"
                  rel="noopener nofollow"
                  className="flex items-center justify-center gap-2 rounded-full bg-[#5865F2] shadow-md p-2 hover:opacity-80 transition-opacity"
                  aria-label="Discord"
                >
                  <FaDiscord className="text-2xl md:text-3xl text-white" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/jurerotar/Pillage-First-Ask-Questions-Later"
                  rel="noopener nofollow"
                  className="flex items-center justify-center gap-2 rounded-full bg-[#24292e] shadow-md p-2 hover:opacity-80 transition-opacity"
                  aria-label="GitHub"
                >
                  <FaGithub className="text-2xl md:text-3xl text-white" />
                </a>
              </li>
            </ul>
          </nav>

          <div className="flex flex-col gap-2">
            <Text
              as="span"
              className="font-medium uppercase text-xs text-muted-foreground"
            >
              {t('Preferences')}
            </Text>
            {isMounted ? (
              <Select
                value={uiColorScheme}
                onValueChange={async (value: UIColorScheme) => {
                  await setCookie(UI_COLOR_SCHEME_COOKIE_NAME, value);
                }}
              >
                <SelectTrigger size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{t('Light')}</SelectItem>
                  <SelectItem value="dark">{t('Dark')}</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="h-8 w-24 bg-gray-100 animate-pulse rounded-md" />
            )}
          </div>
        </div>
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
