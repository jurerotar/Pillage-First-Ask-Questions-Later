import changelogRaw from '../../../../../CHANGELOG.md?raw';
import { parseChangelog } from '../(latest-updates)/mdx/changelog-parser';

const escapeXml = (value: string): string => {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
};

const toPubDate = (dateText: string): string => {
  const parsed = new Date(`${dateText} 12:00:00 UTC`);

  if (Number.isNaN(parsed.getTime())) {
    return new Date().toUTCString();
  }

  return parsed.toUTCString();
};

const buildRssXml = (): string => {
  const releases = parseChangelog(changelogRaw);

  const items = releases
    .map((release) => {
      const description = Object.entries(release.groups)
        .flatMap(([tag, messages]) =>
          messages.map((message) => `[${tag}] ${message}`),
        )
        .join('\n');

      const releaseVersion = release.version.replace('Version', '').trim();

      return `
    <item>
      <title>${escapeXml(release.version)}</title>
      <link>https://pillagefirst.com/latest-updates</link>
      <guid>https://pillagefirst.com/latest-updates#${escapeXml(releaseVersion)}</guid>
      <pubDate>${toPubDate(release.date)}</pubDate>
      <description>${escapeXml(description)}</description>
    </item>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Pillage First! - Latest updates</title>
    <link>https://pillagefirst.com/latest-updates</link>
    <description>Release notes from Pillage First! generated from CHANGELOG.md.</description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}
  </channel>
</rss>`;
};

const rssXml = buildRssXml();

const RssPage = () => {
  return <>{rssXml}</>;
};

export default RssPage;
