import type { ReactNode } from 'react';
import { Alert } from 'app/components/ui/alert';
import {
  type ChangelogEntry,
  groupOrder,
  makeSectionId,
  parseChangelog as parseChangelogFromMarkdown,
} from 'app/utils/changelog';
import changelogRaw from '../../../../../../CHANGELOG.md?raw';
import { BugFixesBlock } from './components/bug-fixes-block';
import { CopyReleaseButton } from './components/copy-release-button';
import { FeaturesBlock } from './components/features-block';
import { PerformanceBlock } from './components/performance-block';
import { TechnicalImprovementBlock } from './components/technical-improvement-block';

const tagToBlock = {
  Feature: FeaturesBlock,
  BugFix: BugFixesBlock,
  Performance: PerformanceBlock,
  TechnicalImprovement: TechnicalImprovementBlock,
};

const inlineMarkdownPattern =
  /(<br\s*\/?>)|\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)]\(([^)]+)\)/gi;

const renderInlineMarkdown = (text: string): ReactNode[] => {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  for (const match of text.matchAll(inlineMarkdownPattern)) {
    if (match.index === undefined) {
      continue;
    }

    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      nodes.push(<br key={key++} />);
    } else if (match[2]) {
      nodes.push(<strong key={key++}>{match[2]}</strong>);
    } else if (match[3]) {
      nodes.push(<code key={key++}>{match[3]}</code>);
    } else if (match[4] && match[5]) {
      nodes.push(
        <a
          key={key++}
          href={match[5]}
        >
          {match[4]}
        </a>,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
};

const releases = parseChangelogFromMarkdown(changelogRaw);

export const ChangelogRenderer = () => {
  if (!releases.length) {
    return null;
  }

  return (
    <>
      {releases.map((release) => (
        <section
          key={release.version}
          id={makeSectionId(release.version)}
          style={{ position: 'relative' }}
        >
          {import.meta.env.DEV && (
            <CopyReleaseButton text={buildReleaseMarkdown(release)} />
          )}
          <h2>Version {release.version}</h2>
          <h4>
            {release.date.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </h4>

          {groupOrder.map((tag) => {
            const items = release.groups[tag] ?? [];

            if (!items.length) {
              return null;
            }

            if (tag === 'Breaking') {
              return (
                <Alert
                  key={tag}
                  variant="error"
                >
                  {items[0]}
                </Alert>
              );
            }

            const Block =
              tagToBlock[tag as keyof typeof tagToBlock] ??
              TechnicalImprovementBlock;

            return (
              <Block key={tag}>
                <ul>
                  {items.map((item) => (
                    <li key={item}>{renderInlineMarkdown(item)}</li>
                  ))}
                </ul>
              </Block>
            );
          })}
        </section>
      ))}
    </>
  );
};

const buildReleaseMarkdown = (release: ChangelogEntry): string => {
  const lines: string[] = [];

  lines.push(`Version ${release.version} released`);

  lines.push(
    release.date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
  );

  lines.push('');

  const groupTitle: Record<(typeof groupOrder)[number], string> = {
    Breaking: 'Breaking changes',
    Feature: 'Features',
    BugFix: 'Bug fixes',
    Performance: 'Performance',
    TechnicalImprovement: 'Technical improvements',
  } as const;

  for (const tag of groupOrder) {
    const items = release.groups[tag] ?? [];
    if (!items.length) {
      continue;
    }

    lines.push(`**${groupTitle[tag]}**`);
    lines.push('');

    const listItems = tag === 'Breaking' ? [items[0]] : items;
    for (const item of listItems) {
      lines.push(`* ${item}`);
    }

    lines.push('');
  }

  const known = new Set<string>(groupOrder as readonly string[]);
  const unknownTags = Object.keys(release.groups)
    .filter((k) => !known.has(k) && (release.groups[k]?.length ?? 0) > 0)
    .sort();

  for (const tag of unknownTags) {
    const items = release.groups[tag] ?? [];
    lines.push(`**${tag}**`);
    lines.push('');
    for (const item of items) {
      lines.push(`* ${item}`);
    }
    lines.push('');
  }

  lines.push('');
  lines.push('Links:');
  lines.push('');
  lines.push('* [Try it out at pillagefirst.com](https://pillagefirst.com)');
  lines.push(
    '* [Star us on GitHub](https://github.com/jurerotar/Pillage-First-Ask-Questions-Later)',
  );
  lines.push(
    '* [Join the community on Discord](https://discord.gg/Ep7NKVXUZA)',
  );

  while (lines.length && lines[lines.length - 1] === '') {
    lines.pop();
  }

  return lines.join('\n');
};
