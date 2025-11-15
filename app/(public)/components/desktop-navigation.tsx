import { useTranslation } from 'react-i18next';
import {
  type PropsWithChildren,
  type ReactNode,
  useEffect,
  useState,
} from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { Link, type LinkProps, useLocation } from 'react-router';
import { FaDiscord, FaGithub } from 'react-icons/fa6';
import { BiWorld } from 'react-icons/bi';
import { IoCreate } from 'react-icons/io5';
import { IoIosChatbubbles } from 'react-icons/io';
import { PiHandshakeBold } from 'react-icons/pi';
import { Button } from 'app/components/ui/button';
import { CiImport } from 'react-icons/ci';

const DropdownContent = ({ children }: PropsWithChildren) => {
  return (
    <div className="absolute top-full left-0 mt-0 w-64 bg-white rounded-lg shadow-xl border border-border py-2 pt-4 z-20">
      <div className="absolute -top-2 left-12 w-4 h-4 bg-white border-t border-l border-border rotate-45" />
      {children}
    </div>
  );
};

type DropdownLinkContentProps = {
  label: string;
  description: string;
  icon: ReactNode;
};

const DropdownLinkContent = ({
  label,
  description,
  icon,
}: DropdownLinkContentProps) => {
  return (
    <>
      <span className="mt-0.5 text-lg text-gray-400">{icon}</span>
      <span className="flex flex-col">
        <span className="font-medium">{label}</span>
        <span className="text-xs text-slate-500 mt-0.5">{description}</span>
      </span>
    </>
  );
};

type NavMenuProps = {
  label: string;
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

const NavMenu = ({
  label,
  children,
  isOpen,
  onMouseEnter,
  onMouseLeave,
}: PropsWithChildren<NavMenuProps>) => {
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: TODO: Fix this
    <div
      className="relative"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        type="button"
        className="flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900 py-4 px-1"
      >
        {label}
        <FaChevronDown className="size-3 mt-1" />
      </button>
      {isOpen && <DropdownContent>{children}</DropdownContent>}
    </div>
  );
};

const _NavLink = (props: PropsWithChildren<LinkProps>) => {
  return (
    <Link
      className="text-sm font-medium text-slate-700 hover:text-slate-900 py-4 px-1"
      {...props}
    />
  );
};

export const DesktopNavigation = () => {
  const { t } = useTranslation('public');
  const { key } = useLocation();

  const [activeDropdown, setActiveDropdown] = useState<
    'game' | 'resources' | 'guides' | 'social' | null
  >(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Key is expected
  useEffect(() => {
    setActiveDropdown(null);
  }, [key]);

  return (
    <nav className="hidden lg:flex max-w-7xl mx-auto px-4 w-[calc(100%-1rem)] bg-white justify-between my-4 mb-6 border border-border rounded-md shadow-xl z-20">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-8">
          <Link to="/">
            <img
              alt={t('Pillage First! logo')}
              width="200"
              src="/pillage-first-logo-horizontal.svg"
            />
          </Link>

          <div className="flex items-center gap-6">
            <NavMenu
              label={t('Game')}
              isOpen={activeDropdown === 'game'}
              onMouseEnter={() => setActiveDropdown('game')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link
                to="/my-game-worlds"
                className="flex items-start gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <DropdownLinkContent
                  label={t('My game worlds')}
                  description={t('Manage your existing game worlds')}
                  icon={<BiWorld />}
                />
              </Link>
              <Link
                to="/create-new-game-world"
                className="flex items-start gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <DropdownLinkContent
                  label={t('Create new game world')}
                  description={t('Create and configure a new world')}
                  icon={<IoCreate />}
                />
              </Link>
              <Link
                to="/import-game-world"
                className="flex items-start gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <DropdownLinkContent
                  label={t('Import game world')}
                  description={t('Import existing game world')}
                  icon={<CiImport />}
                />
              </Link>
            </NavMenu>

            <NavMenu
              label={t('Resources')}
              isOpen={activeDropdown === 'resources'}
              onMouseEnter={() => setActiveDropdown('resources')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link
                to="/frequently-asked-questions"
                className="flex items-start gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <DropdownLinkContent
                  label={t('Frequently asked questions')}
                  description={t('Answers to common questions')}
                  icon={<IoIosChatbubbles />}
                />
              </Link>
              <Link
                to="/get-involved"
                className="flex items-start gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <DropdownLinkContent
                  label={t('Get involved')}
                  description={t('Contribute or join the community')}
                  icon={<PiHandshakeBold />}
                />
              </Link>
            </NavMenu>

            <NavMenu
              label={t('Social')}
              isOpen={activeDropdown === 'social'}
              onMouseEnter={() => setActiveDropdown('social')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <a
                href="https://discord.gg/Ep7NKVXUZA"
                className="flex items-start gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <DropdownLinkContent
                  label={'Discord'}
                  description={t('Join the community')}
                  icon={<FaDiscord />}
                />
              </a>
              <a
                href="https://github.com/jurerotar/Pillage-First-Ask-Questions-Later"
                className="flex items-start gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <DropdownLinkContent
                  label={'GitHub'}
                  description={t('Contribute or raise issues')}
                  icon={<FaGithub />}
                />
              </a>
            </NavMenu>

            <span className="text-sm font-medium text-slate-700 hover:text-slate-900 py-4 px-1">
              Wiki (coming soon)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/create-new-game-world">
            <Button>{t('Try now')}</Button>
          </Link>
          <Link to="/my-game-worlds">
            <Button variant="outline">{t('Existing game worlds')}</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};
