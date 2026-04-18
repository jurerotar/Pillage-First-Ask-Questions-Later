import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import { remark } from 'remark';
import remarkRehype from 'remark-rehype';
import { Alert } from 'app/components/ui/alert';
import changelogRaw from '../../../../../../CHANGELOG.md?raw';
import { BugFixesBlock } from './components/bug-fixes-block';
import { FeaturesBlock } from './components/features-block';
import { PerformanceBlock } from './components/performance-block';
import { TechnicalImprovementBlock } from './components/technical-improvement-block';

type Release = {
  version: string;
  date: string;
  groups: Record<string, string[]>;
};

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

const parseChangelog = (raw: unknown): Release[] => {
  if (typeof raw !== 'string') {
    return [];
  }

  const markdown = raw;

  const releases: Release[] = [];
  const lines = markdown.split(/\r?\n/);

  let currentRelease: Release | null = null;
  let lastItemTag: string | null = null;

  for (const line of lines) {
    const versionMatch = line.match(/^##\s+(.*)$/);
    if (versionMatch) {
      if (currentRelease) {
        releases.push(currentRelease);
      }

      currentRelease = {
        version: versionMatch[1],
        date: '',
        groups: {},
      };
      lastItemTag = null;
      continue;
    }

    if (!currentRelease) {
      continue;
    }

    const dateMatch = line.match(/^####\s+(.*)$/);
    if (dateMatch) {
      currentRelease.date = dateMatch[1];
      lastItemTag = null;
      continue;
    }

    const itemMatch = line.match(/^\*\s+\[([^\]]+)]\s+(.*)$/);
    if (itemMatch) {
      const tag = itemMatch[1].trim();
      const text = itemMatch[2].trim();

      if (!currentRelease.groups[tag]) {
        currentRelease.groups[tag] = [];
      }

      currentRelease.groups[tag].push(text);
      lastItemTag = tag;
      continue;
    }

    const continuationMatch = line.match(/^\s{2,}(\S.*)$/);
    if (continuationMatch && lastItemTag) {
      const items = currentRelease.groups[lastItemTag];

      if (items?.length) {
        const continuationText = continuationMatch[1].trim();
        items[items.length - 1] =
          `${items[items.length - 1]} ${continuationText}`;
      }
    }
  }

  if (currentRelease) {
    releases.push(currentRelease);
  }

  return releases;
};

const releases = parseChangelog(changelogRaw);

const groupOrder = [
  'Breaking',
  'Feature',
  'BugFix',
  'Performance',
  'TechnicalImprovement',
];

export const ChangelogRenderer = () => {
  if (!releases.length) {
    return null;
  }

  return (
    <>
      {releases.map((release) => (
        <section key={release.version}>
          <h2>{release.version}</h2>
          {release.date ? <h4>{release.date}</h4> : null}

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
