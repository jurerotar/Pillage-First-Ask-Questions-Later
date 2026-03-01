import { clsx } from 'clsx';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaChevronDown } from 'react-icons/fa';
import { Link, useLocation } from 'react-router';
import { buildings } from '@pillage-first/game-assets/buildings';
import { units } from '@pillage-first/game-assets/units';
import { Text } from 'app/components/text';

interface WikiNavLink {
  title: string;
  to: string;
  items?: WikiNavLink[];
}

const NavLink = ({
  link,
  depth = 0,
}: {
  link: WikiNavLink;
  depth?: number;
}) => {
  const location = useLocation();
  const hasItems = link.items && link.items.length > 0;
  const isActive = location.pathname === link.to;

  const content = hasItems ? (
    <span
      className={clsx(
        'text-sm transition-colors block py-1 text-muted-foreground group-hover:text-foreground',
      )}
    >
      {link.title}
    </span>
  ) : (
    <Link
      to={link.to}
      className={clsx(
        'text-sm transition-colors block py-1',
        isActive
          ? 'text-foreground font-medium'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {link.title}
    </Link>
  );

  if (hasItems) {
    const isChildActive = link.items!.some(
      (item) =>
        location.pathname === item.to ||
        (item.items && item.items.some((sub) => location.pathname === sub.to)),
    );

    return (
      <details
        className="group"
        open={isActive || isChildActive}
      >
        <summary className="list-none flex items-center justify-between cursor-pointer group">
          {content}
          <span className="text-[10px] text-muted-foreground group-open:rotate-180 transition-transform px-2">
            <FaChevronDown />
          </span>
        </summary>
        <div className="pl-4 flex flex-col border-l ml-1 mt-1">
          {link.items!.map((item) => (
            <NavLink
              key={item.to}
              link={item}
              depth={depth + 1}
            />
          ))}
        </div>
      </details>
    );
  }

  return content;
};

export const WikiMainNavigation = ({
  showTitle = true,
}: {
  showTitle?: boolean;
}) => {
  const { t } = useTranslation(['public', 'assets']);

  const wikiLinks: WikiNavLink[] = useMemo(() => {
    const unitGroups = units.reduce<Record<string, WikiNavLink[]>>(
      (acc, unit) => {
        const tribe = unit.tribe === 'all' ? 'special' : unit.tribe;
        if (!acc[tribe]) {
          acc[tribe] = [];
        }
        acc[tribe].push({
          title: t(`assets:UNITS.${unit.id}.NAME`, { defaultValue: unit.id }),
          to: `/wiki/units/${unit.id}`,
        });
        return acc;
      },
      {},
    );

    const unitItems = Object.entries(unitGroups).map(([tribe, items]) => ({
      title: t(`assets:TRIBES.${tribe.toUpperCase()}`, {
        defaultValue: tribe.charAt(0).toUpperCase() + tribe.slice(1),
      }),
      to: `/wiki/units#${tribe}`,
      items: items.sort((a, b) => a.title.localeCompare(b.title)),
    }));

    const buildingGroups = buildings.reduce<Record<string, WikiNavLink[]>>(
      (acc, building) => {
        const category = building.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push({
          title: t(`assets:BUILDINGS.${building.id}.NAME`, {
            defaultValue: building.id,
          }),
          to: `/wiki/buildings/${building.id}`,
        });
        return acc;
      },
      {},
    );

    const buildingItems = Object.entries(buildingGroups).map(
      ([category, items]) => ({
        title: t(`assets:BUILDING_CATEGORIES.${category.toUpperCase()}`, {
          defaultValue: category.charAt(0).toUpperCase() + category.slice(1),
        }),
        to: `/wiki/buildings#${category}`,
        items: items.sort((a, b) => a.title.localeCompare(b.title)),
      }),
    );

    return [
      {
        title: t('public:Index'),
        to: '/wiki',
      },
      {
        title: t('public:Units'),
        to: '/wiki/units',
        items: unitItems.sort((a, b) => a.title.localeCompare(b.title)),
      },
      {
        title: t('public:Buildings'),
        to: '/wiki/buildings',
        items: buildingItems.sort((a, b) => a.title.localeCompare(b.title)),
      },
    ];
  }, [t]);

  return (
    <nav className="flex flex-col gap-4">
      {showTitle && (
        <Text
          as="h3"
          variant="muted"
          className="uppercase text-xs tracking-wider"
        >
          {t('public:Wiki Navigation')}
        </Text>
      )}
      <div className="flex flex-col gap-1">
        {wikiLinks.map((link) => (
          <NavLink
            key={link.to}
            link={link}
          />
        ))}
      </div>
    </nav>
  );
};
