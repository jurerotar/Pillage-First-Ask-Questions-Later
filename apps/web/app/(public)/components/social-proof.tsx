import { clsx } from 'clsx';
import type { ComponentType, PropsWithChildren, ReactNode } from 'react';
import {
  FaArrowUpRightFromSquare,
  FaDiscord,
  FaQuoteLeft,
  FaUsers,
  FaXTwitter,
} from 'react-icons/fa6';
import { useDiscordMembers } from 'app/(public)/hooks/use-discord-members';
import { Text } from 'app/components/text';

type SocialProofMasonryProps = PropsWithChildren<{
  className?: string;
}>;

export const SocialProofMasonry = ({
  className,
  children,
}: SocialProofMasonryProps) => {
  return (
    <div
      className={clsx(
        'flex snap-x snap-mandatory gap-4 overflow-x-auto md:block md:columns-2 md:gap-4 md:overflow-visible md:pb-0 xl:columns-3',
        className,
      )}
    >
      {children}
    </div>
  );
};

type SocialProofCardProps = {
  author: string;
  body: ReactNode;
  className?: string;
  href?: string;
  icon: ComponentType<{ className?: string }>;
  meta?: ReactNode;
  source: string;
  tone: 'discord' | 'twitter';
};

const cardToneStyles: Record<SocialProofCardProps['tone'], string> = {
  discord:
    'border-[#5865F2]/25 bg-[#5865F2]/5 hover:border-[#5865F2]/45 dark:bg-[#5865F2]/10',
  twitter:
    'border-sky-500/25 bg-sky-500/5 hover:border-sky-500/45 dark:bg-sky-500/10',
};

const SocialProofCard = ({
  author,
  body,
  className,
  href,
  icon: Icon,
  meta,
  source,
  tone,
}: SocialProofCardProps) => {
  const content = (
    <article
      className={clsx(
        'mb-4 w-72 shrink-0 snap-center break-inside-avoid rounded-md border bg-card p-4 shadow-xs transition-colors md:w-auto md:shrink',
        cardToneStyles[tone],
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-background shadow-xs">
            <Icon className="size-4" />
          </span>
          <div className="min-w-0">
            <Text
              as="h3"
              className="truncate text-sm font-bold"
            >
              {author}
            </Text>
            <Text
              as="p"
              variant="muted"
              className="text-xs leading-5"
            >
              {source}
            </Text>
          </div>
        </div>
        {href && (
          <FaArrowUpRightFromSquare className="size-3 shrink-0 text-muted-foreground" />
        )}
      </div>

      <div className="flex gap-3">
        <FaQuoteLeft className="mt-1 size-4 shrink-0 text-muted-foreground" />
        <Text className="text-sm leading-6">{body}</Text>
      </div>

      {meta && (
        <Text
          as="p"
          variant="muted"
          className="mt-4 text-xs leading-5"
        >
          {meta}
        </Text>
      )}
    </article>
  );

  if (!href) {
    return content;
  }

  return (
    <a
      rel="noopener noreferrer"
      target="_blank"
      href={href}
      className="block focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-md"
    >
      {content}
    </a>
  );
};

type TwitterSocialProofCardProps = {
  author: string;
  body: ReactNode;
  className?: string;
  href?: string;
  meta?: ReactNode;
};

export const TwitterSocialProofCard = ({
  author,
  body,
  className,
  href,
  meta,
}: TwitterSocialProofCardProps) => {
  return (
    <SocialProofCard
      author={author}
      body={body}
      className={className}
      href={href}
      icon={FaXTwitter}
      meta={meta}
      source="X / Twitter"
      tone="twitter"
    />
  );
};

type DiscordSocialProofCardProps = {
  author: string;
  body: ReactNode;
  className?: string;
  href?: string;
  meta?: ReactNode;
  showMemberCount?: boolean;
};

export const DiscordSocialProofCard = ({
  author,
  body,
  className,
  href = 'https://discord.gg/Ep7NKVXUZA',
  meta,
  showMemberCount = false,
}: DiscordSocialProofCardProps) => {
  const { data: discordData } = useDiscordMembers();
  const memberCount =
    showMemberCount && discordData?.memberCount !== undefined ? (
      <span className="inline-flex items-center gap-1">
        <FaUsers className="size-3" />
        {discordData.memberCount} Discord members
      </span>
    ) : undefined;

  return (
    <SocialProofCard
      author={author}
      body={body}
      className={className}
      href={href}
      icon={FaDiscord}
      meta={meta ?? memberCount}
      source="Discord"
      tone="discord"
    />
  );
};
