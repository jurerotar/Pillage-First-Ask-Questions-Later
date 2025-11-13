import { useTranslation } from 'react-i18next';
import { type PropsWithChildren, type ReactNode, useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { Link, type LinkProps } from 'react-router';
import { FaDiscord, FaGithub } from 'react-icons/fa6';
import { BiWorld } from 'react-icons/bi';
import { IoCreate } from 'react-icons/io5';
import { IoIosChatbubbles } from 'react-icons/io';
import { PiHandshakeBold } from 'react-icons/pi';
import { Button } from 'app/components/ui/button';

const DropdownContent = ({
  isOpen,
  children,
}: PropsWithChildren<{ isOpen: boolean }>) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 mt-0 w-64 bg-white rounded-lg shadow-xl border border-border py-2 pt-4">
      <div className="absolute -top-2 left-12 w-4 h-4 bg-white border-t border-l border-border rotate-45" />
      {children}
    </div>
  );
};

type DropdownLinkProps = {
  href: string;
  label: string;
  description?: string;
  icon?: ReactNode;
};

const DropdownLink = ({
  href,
  label,
  description,
  icon,
}: DropdownLinkProps) => {
  return (
    <a
      href={href}
      className="flex items-start gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
    >
      {icon ? (
        <span className="mt-0.5 text-lg text-gray-400">{icon}</span>
      ) : null}
      <span className="flex flex-col">
        <span className="font-medium">{label}</span>
        {description ? (
          <span className="text-xs text-slate-500 mt-0.5">{description}</span>
        ) : null}
      </span>
    </a>
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
      <DropdownContent isOpen={isOpen}>{children}</DropdownContent>
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

  const [activeDropdown, setActiveDropdown] = useState<
    'game' | 'resources' | 'guides' | 'social' | null
  >(null);

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
              <DropdownLink
                href="/my-game-worlds"
                label={t('My game worlds')}
                description={t('Manage your existing game worlds')}
                icon={<BiWorld />}
              />
              <DropdownLink
                href="/create-new-game-world"
                label={t('Create new game world')}
                description={t('Create and configure a new world')}
                icon={<IoCreate />}
              />
            </NavMenu>

            <NavMenu
              label={t('Resources')}
              isOpen={activeDropdown === 'resources'}
              onMouseEnter={() => setActiveDropdown('resources')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <DropdownLink
                href="/frequently-asked-questions"
                label={t('Frequently asked questions')}
                description={t('Answers to common questions')}
                icon={<IoIosChatbubbles />}
              />
              <DropdownLink
                href="/get-involved"
                label={t('Get involved')}
                description={t('Contribute or join the community')}
                icon={<PiHandshakeBold />}
              />
            </NavMenu>

            <NavMenu
              label={t('Social')}
              isOpen={activeDropdown === 'social'}
              onMouseEnter={() => setActiveDropdown('social')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <DropdownLink
                href="https://discord.gg/Ep7NKVXUZA"
                label={'Discord'}
                description={t('Join the community')}
                icon={<FaDiscord />}
              />
              <DropdownLink
                href="https://github.com/jurerotar/Pillage-First-Ask-Questions-Later"
                label={'GitHub'}
                description={t('Contribute or raise issues')}
                icon={<FaGithub />}
              />
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
