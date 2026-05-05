import { Alert } from 'app/components/ui/alert';
import changelogRaw from '../../../../../../CHANGELOG.md?raw';
import { parseChangelog, renderInlineMarkdown } from './changelog-parser';
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
