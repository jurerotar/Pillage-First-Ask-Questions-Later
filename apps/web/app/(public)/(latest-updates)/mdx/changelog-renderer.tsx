import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import { remark } from 'remark';
import remarkRehype from 'remark-rehype';
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

const markdownProcessor = remark()
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeStringify);

const renderInlineMarkdown = (text: string): string => {
  const html = markdownProcessor.processSync(text).toString().trim();

  if (html.startsWith('<p>') && html.endsWith('</p>')) {
    return html.slice(3, -4);
  }

  return html;
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
                    <li
                      key={item}
                      // biome-ignore lint/security/noDangerouslySetInnerHtml: it's fine here
                      dangerouslySetInnerHTML={{
                        __html: renderInlineMarkdown(item),
                      }}
                    />
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
