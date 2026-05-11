import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import { remark } from 'remark';
import remarkRehype from 'remark-rehype';
import { Alert } from 'app/components/ui/alert';
import {
  groupOrder,
  makeSectionId,
  parseChangelog as parseChangelogFromMarkdown,
} from 'app/utils/changelog';
import changelogRaw from '../../../../../../CHANGELOG.md?raw';
import { BugFixesBlock } from './components/bug-fixes-block';
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

const releases =
  typeof changelogRaw === 'string'
    ? parseChangelogFromMarkdown(changelogRaw)
    : [];

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
        >
          <h2>{release.version}</h2>
          {release.date ? (
            <h4>
              {release.date.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </h4>
          ) : null}

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
