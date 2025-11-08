import { Link, Outlet, useLocation } from 'react-router';
import { FaDiscord, FaGithub } from 'react-icons/fa6';
import { Tooltip } from 'app/components/tooltip';
import { env } from 'app/env';
import { Text } from 'app/components/text';
import { HiOutlineMenu } from 'react-icons/hi';
import { useDialog } from 'app/hooks/use-dialog';
import { Activity, useEffect } from 'react';
import { IoCloseOutline } from 'react-icons/io5';
import { IoCreate } from 'react-icons/io5';
import { IoIosChatbubbles } from 'react-icons/io';
import { BiWorld } from 'react-icons/bi';
import { GrHelpBook } from 'react-icons/gr';
import { PiHandshakeBold } from 'react-icons/pi';
import { Button } from 'app/components/ui/button';
import { useTranslation } from 'react-i18next';

const DesktopHeader = () => {
  const { t: _t } = useTranslation('public');

  return null;
};

const MobileHeader = () => {
  const { t } = useTranslation('public');
  const { key } = useLocation();
  const { isOpen, openModal, closeModal } = useDialog();

  // biome-ignore lint/correctness/useExhaustiveDependencies: Key is expected
  useEffect(() => {
    closeModal();
  }, [key, closeModal]);

  return (
    <header className="block lg:hidden mt-2 mb-4">
      <div className="mx-2 p-2 flex w-[calc(100%-1rem)] justify-between items-center shadow-2xl rounded-lg">
        <Link to="/">
          <img
            alt={t('Pillage First! logo')}
            width="200"
            src="/pillage-first-logo-horizontal.svg"
          />
        </Link>
        <div className="flex items-center">
          <button
            className="p-2 bg-gray-100 rounded-md transition-transform active:scale-95 active:shadow-inner"
            type="button"
            aria-label="Menu"
            onClick={openModal}
          >
            <HiOutlineMenu className="text-xl" />
          </button>
          <Activity mode={isOpen ? 'visible' : 'hidden'}>
            <div className="fixed inset-0 z-50 bg-white/50 backdrop-blur-xs">
              <div className="m-2 bg-white rounded-lg h-[calc(100%-1rem)] p-4">
                <div className="relative flex flex-col gap-2 w-full h-full">
                  <button
                    className="absolute -top-2 -right-2 p-2 bg-gray-100 rounded-md transition-transform active:scale-95 active:shadow-inner"
                    type="button"
                    aria-label="Menu"
                    onClick={closeModal}
                  >
                    <IoCloseOutline className="text-xl" />
                  </button>
                  <Link to="/">
                    <img
                      alt={t('Pillage First! logo')}
                      width="200"
                      src="/pillage-first-logo-horizontal.svg"
                    />
                  </Link>

                  <div className="border border-dashed border-border w-full" />
                  <div className="flex flex-col gap-2">
                    <Text className="text-2xs font-semibold uppercase text-gray-400">
                      {t('Game')}
                    </Text>
                    <ul className="flex flex-col gap-2">
                      <li>
                        <Link
                          className="inline-flex gap-2 items-center"
                          to="/my-game-worlds"
                        >
                          <BiWorld className="text-gray-400 text-lg" />
                          <Text className="font-medium text-gray-800">
                            {t('My game worlds')}
                          </Text>
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="inline-flex gap-2 items-center"
                          to="/create-new-game-world"
                        >
                          <IoCreate className="text-gray-400 text-lg" />
                          <Text className="font-medium text-gray-800">
                            {t('Create a new game world')}
                          </Text>
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <div className="border border-dashed border-border w-full" />
                  <div className="flex flex-col gap-2">
                    <Text className="text-2xs font-semibold uppercase text-gray-400">
                      {t('Resources')}
                    </Text>
                    <ul className="flex flex-col gap-2">
                      <li>
                        <Link
                          className="inline-flex gap-2 items-center"
                          to="/frequently-asked-questions"
                        >
                          <IoIosChatbubbles className="text-gray-400 text-lg" />
                          <Text className="font-medium text-gray-800">
                            {t('Frequently asked questions')}
                          </Text>
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="inline-flex gap-2 items-center"
                          to="/get-involved"
                        >
                          <PiHandshakeBold className="text-gray-400 text-lg" />
                          <Text className="font-medium text-gray-800">
                            {t('Get involved')}
                          </Text>
                        </Link>
                      </li>
                      <li>
                        <span className="inline-flex gap-2 items-center">
                          <GrHelpBook className="text-gray-400 text-lg" />
                          <Text className="font-medium text-gray-800">
                            {t('Wiki (coming soon)')}
                          </Text>
                        </span>
                      </li>
                    </ul>
                  </div>
                  <div className="border border-dashed border-border w-full" />
                  <div className="flex flex-col gap-2">
                    <Text className="text-2xs font-semibold uppercase text-gray-400">
                      {t('Social')}
                    </Text>
                    <ul className="flex flex-col gap-2">
                      <li>
                        <a
                          href="https://discord.gg/Ep7NKVXUZA"
                          rel="noopener"
                          className="inline-flex gap-2 items-center"
                        >
                          <FaDiscord className="text-gray-400 text-lg" />
                          <Text className="font-medium text-gray-800">
                            Discord
                          </Text>
                        </a>
                      </li>
                      <li>
                        <a
                          href="https://github.com/jurerotar/Pillage-First-Ask-Questions-Later"
                          className="inline-flex gap-2 items-center"
                        >
                          <FaGithub className="text-gray-400 text-lg" />
                          <Text className="font-medium text-gray-800">
                            GitHub
                          </Text>
                        </a>
                      </li>
                    </ul>
                  </div>
                  <div className="flex flex-1" />
                  <div className="border border-dashed border-border w-full" />
                  <div className="flex justify-center gap-2">
                    <Link to="/create-new-game-world">
                      <Button>{t('Try now')}</Button>
                    </Link>
                    <Link to="/my-game-worlds">
                      <Button variant="outline">
                        {t('Existing game worlds')}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Activity>
        </div>
      </div>
    </header>
  );
};

const PublicLayout = () => {
  const { t } = useTranslation('public');

  return (
    <>
      <DesktopHeader />
      <MobileHeader />
      <Tooltip id="public-tooltip" />
      <Outlet />
      <footer className="border-t mt-4">
        <div className="container mx-auto grid gap-4 md:gap-8 py-6 lg:py-10 md:grid-cols-4 px-2">
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
                <Link to="/my-game-worlds">
                  <Text className="font-medium text-gray-800">
                    {t('My game worlds')}
                  </Text>
                </Link>
              </li>
              <li>
                <Link to="/create-new-game-world">
                  <Text className="font-medium text-gray-800">
                    {t('Create new game world')}
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
            <ul className="flex gap-2">
              <li>
                <a
                  href="https://discord.gg/Ep7NKVXUZA"
                  rel="noopener"
                  className="flex items-center justify-center gap-2 rounded-full bg-[#7289da] shadow-md p-2 px-4"
                >
                  <FaDiscord className="text-2xl md:text-3xl text-white" />
                  <span className="flex font-semibold text-white">Discord</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/jurerotar/Pillage-First-Ask-Questions-Later"
                  className="flex items-center justify-center gap-2 rounded-full bg-[#24292e] shadow-md p-2 px-4"
                >
                  <FaGithub className="text-2xl md:text-3xl text-white" />
                  <span className="flex font-semibold text-white">GitHub</span>
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="border-t">
          <div className="container mx-auto flex flex-col gap-2 py-4 md:py-6 md:flex-row md:items-center md:justify-between px-2">
            <p className="text-xs text-muted-foreground">
              {t('Not affiliated with Travian Games GmbH.')}
            </p>
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                {t('App version')}: {env.VERSION}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('Commit ref')}: {env.COMMIT_REF}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('Branch')}: {env.HEAD}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default PublicLayout;
