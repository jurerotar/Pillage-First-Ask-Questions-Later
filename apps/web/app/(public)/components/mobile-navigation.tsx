import { Activity, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BiWorld } from 'react-icons/bi';
import { CiImport } from 'react-icons/ci';
import { FaDiscord, FaGithub, FaRegNewspaper } from 'react-icons/fa6';
import { GrHelpBook } from 'react-icons/gr';
import { HiOutlineMenu } from 'react-icons/hi';
import { IoIosChatbubbles } from 'react-icons/io';
import { IoCloseOutline, IoCreate } from 'react-icons/io5';
import { PiHandshakeBold } from 'react-icons/pi';
import { Link, useLocation } from 'react-router';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import { useDialog } from 'app/hooks/use-dialog';

export const MobileNavigation = () => {
  const { t } = useTranslation('public');
  const { key } = useLocation();
  const { isOpen, openModal, closeModal } = useDialog();

  // biome-ignore lint/correctness/useExhaustiveDependencies: Key is expected
  useEffect(() => {
    closeModal();
  }, [key, closeModal]);

  return (
    <header className="flex lg:hidden mt-2 mb-4 mx-2 p-2  w-[calc(100%-1rem)] justify-between items-center shadow-2xl border border-border rounded-lg">
      <Link to="/">
        <img
          alt={t('Pillage First! logo')}
          width="200"
          height="30"
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
            <div className="m-2 bg-white rounded-lg h-[calc(100%-1rem)] p-4 overflow-y-auto scrollbar-hidden">
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
                    height="30"
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
                        to="/game-worlds"
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
                        to="/game-worlds/create"
                      >
                        <IoCreate className="text-gray-400 text-lg" />
                        <Text className="font-medium text-gray-800">
                          {t('Create a new game world')}
                        </Text>
                      </Link>
                    </li>
                    <li>
                      <Link
                        className="inline-flex gap-2 items-center"
                        to="/game-worlds/import"
                      >
                        <CiImport className="text-gray-400 text-lg" />
                        <Text className="font-medium text-gray-800">
                          {t('Import game world')}
                        </Text>
                      </Link>
                    </li>
                  </ul>
                </div>

                <div className="border border-dashed border-border w-full" />

                <ul className="flex flex-col gap-2">
                  <li>
                    <Link
                      className="inline-flex gap-2 items-center"
                      to="/latest-updates"
                    >
                      <FaRegNewspaper className="text-gray-400 text-lg" />
                      <Text className="font-medium text-gray-800">
                        {t('Latest updates')}
                      </Text>
                    </Link>
                  </li>
                </ul>

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
                      <Link
                        className="inline-flex gap-2 items-center"
                        to="/wiki"
                      >
                        <GrHelpBook className="text-gray-400 text-lg" />
                        <Text className="font-medium text-gray-800">
                          {t('Wiki')}
                        </Text>
                      </Link>
                    </li>
                  </ul>
                </div>

                <div className="border border-dashed border-border w-full" />
                <div className="flex flex-col gap-2">
                  <Text className="text-2xs font-semibold uppercase text-gray-400">
                    {t('Community')}
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
                  <Link to="/game-worlds/create">
                    <Button>{t('Try now')}</Button>
                  </Link>
                  <Link to="/game-worlds">
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
    </header>
  );
};
