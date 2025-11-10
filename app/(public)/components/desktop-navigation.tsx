import { useTranslation } from 'react-i18next';
import { type PropsWithChildren, useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { Link, type LinkProps } from 'react-router';

const DropdownContent = ({
  isOpen,
  children,
}: PropsWithChildren<{ isOpen: boolean }>) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 mt-0 w-64 bg-white rounded-lg shadow-xl border border-gray-100 py-2 pt-4">
      <div className="absolute -top-2 left-12 w-4 h-4 bg-white border-t border-l border-gray-100 rotate-45" />
      {children}
    </div>
  );
};

type DropdownLinkProps = {
  href: string;
  label: string;
  description: string;
};

const DropdownLink = ({ href, label, description }: DropdownLinkProps) => {
  return (
    <a
      href={href}
      className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
    >
      <div className="font-medium">{label}</div>
      <div className="text-xs text-slate-500 mt-0.5">{description}</div>
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
    <div className="relative">
      <button
        type="button"
        className="flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900 py-4 px-1"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {label}
        <FaChevronDown className="w-4 h-4" />
      </button>
      <DropdownContent isOpen={isOpen}>{children}</DropdownContent>
    </div>
  );
};

const NavLink = (props: PropsWithChildren<LinkProps>) => {
  return (
    <Link
      className="text-sm font-medium text-slate-700 hover:text-slate-900 py-4 px-1"
      {...props}
    />
  );
};

export const DesktopNavigation = () => {
  const { t: _t } = useTranslation('public');

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  return (
    <nav className="hidden lg:block bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="text-xl font-semibold text-slate-900">stripe</div>

            <div className="flex items-center gap-6">
              <NavMenu
                label="Products"
                isOpen={activeDropdown === 'products'}
                onMouseEnter={() => setActiveDropdown('products')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <DropdownLink
                  href="#payments"
                  label="Payments"
                  description="Online payments"
                />
                <DropdownLink
                  href="#billing"
                  label="Billing"
                  description="Subscription management"
                />
                <DropdownLink
                  href="#connect"
                  label="Connect"
                  description="Payments for platforms"
                />
              </NavMenu>

              <NavMenu
                label="Solutions"
                isOpen={activeDropdown === 'solutions'}
                onMouseEnter={() => setActiveDropdown('solutions')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <DropdownLink
                  href="#startups"
                  label="Startups"
                  description="Get started quickly"
                />
                <DropdownLink
                  href="#enterprise"
                  label="Enterprise"
                  description="Scale securely"
                />
              </NavMenu>

              <NavMenu
                label="Developers"
                isOpen={activeDropdown === 'developers'}
                onMouseEnter={() => setActiveDropdown('developers')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <DropdownLink
                  href="#docs"
                  label="Documentation"
                  description="Start integrating"
                />
                <DropdownLink
                  href="#api"
                  label="API Reference"
                  description="Complete API docs"
                />
              </NavMenu>

              <NavLink to="">Pricing</NavLink>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NavLink to="">Sign in</NavLink>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-full transition-colors my-2"
            >
              Contact sales
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
