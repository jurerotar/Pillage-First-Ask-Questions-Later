import { useId } from 'react';
import { Link } from 'react-router';
import { Text } from 'app/components/text';

type WikiRelatedLinksProps = {
  links: readonly { to: string; label: string }[];
};

export const WikiRelatedLinks = ({ links }: WikiRelatedLinksProps) => {
  const labelId = useId();

  return (
    <nav
      aria-labelledby={labelId}
      className="border-t border-border pt-4"
    >
      <Text
        as="h2"
        id={labelId}
      >
        Related links
      </Text>
      <ul className="mt-2 flex list-disc flex-col gap-1 ps-5">
        {links.map(({ to, label }) => (
          <li key={to}>
            <Link
              className="text-link font-medium underline"
              to={to}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};
