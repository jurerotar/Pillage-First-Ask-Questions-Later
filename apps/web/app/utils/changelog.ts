import { parseAppVersion } from '@pillage-first/utils/version';

const parseDateLine = (line: string): Date | null => {
  // Example: "#### May 10, 2026"
  const trimmed = line.replace(/^#+\s*/, '').trim();
  const d = new Date(trimmed);
  return Number.isNaN(+d) ? null : d;
};

export const parseChangelog = (markdown: string): ChangelogEntry[] => {
  const lines = markdown.split(/\r?\n/);
  const entries: ChangelogEntry[] = [];

  let currentVersion: string | null = null;
  let currentDate: Date | null = null;
  let currentGroups: Record<string, string[]> | null = null;
  let lastItemTag: string | null = null;

  const pushCurrent = () => {
    if (currentVersion && currentDate && currentGroups) {
      entries.push({
        version: currentVersion,
        date: currentDate,
        groups: currentGroups,
      });
    }
    currentVersion = null;
    currentDate = null;
    currentGroups = null;
    lastItemTag = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Version header: "## Version X"
    const versionMatch = line.match(/^##\s+Version\s+(.+)$/i);
    if (versionMatch) {
      pushCurrent();
      currentVersion = versionMatch[1].trim();
      currentGroups = {};
      lastItemTag = null;
      continue;
    }

    if (!currentVersion) {
      continue;
    }

    // Date line: "#### Month dd, yyyy"
    if (!currentDate) {
      const maybeDate = parseDateLine(line);
      if (maybeDate) {
        currentDate = maybeDate;
        lastItemTag = null;
        continue;
      }
    }

    if (!currentDate || !currentGroups) {
      continue;
    }

    // Bullet with tag: * [Tag] text
    const itemMatch = line.match(/^\*\s+\[([^\]]+)]\s+(.*)$/);
    if (itemMatch) {
      const tag = itemMatch[1].trim();
      const text = itemMatch[2].trim();
      if (!currentGroups[tag]) {
        currentGroups[tag] = [];
      }
      currentGroups[tag].push(text);
      lastItemTag = tag;
      continue;
    }

    // Continuation of previous bullet: at least two leading spaces
    const continuationMatch = line.match(/^\s{2,}(\S.*)$/);
    if (
      continuationMatch &&
      lastItemTag &&
      currentGroups[lastItemTag]?.length
    ) {
      const continuationText = continuationMatch[1].trim();
      const items = currentGroups[lastItemTag];
      items[items.length - 1] =
        `${items[items.length - 1]} ${continuationText}`;
    }
  }

  // Push last entry
  pushCurrent();

  return entries;
};

export const escapeXml = (s: string): string => {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

export const toRssXml = (options: {
  title: string;
  link: string; // absolute site link
  description: string;
  language?: string;
  items: {
    id: string;
    title: string;
    link: string;
    description: string;
    pubDate: Date;
  }[];
}): string => {
  const { title, link, description, language, items } = options;
  const lastBuildDate = items[0]?.pubDate ?? new Date();
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0">\n` +
    '<channel>\n' +
    `<title>${escapeXml(title)}</title>\n` +
    `<link>${escapeXml(link)}</link>\n` +
    `<description><![CDATA[${description}]]></description>\n` +
    (language ? `<language>${escapeXml(language)}</language>\n` : '') +
    `<lastBuildDate>${lastBuildDate.toUTCString()}</lastBuildDate>\n` +
    items
      .map(
        (it) =>
          '<item>\n' +
          `<guid isPermaLink="false">${escapeXml(it.id)}</guid>\n` +
          `<title>${escapeXml(it.title)}</title>\n` +
          `<link>${escapeXml(it.link)}</link>\n` +
          `<description><![CDATA[${it.description}]]></description>\n` +
          `<pubDate>${it.pubDate.toUTCString()}</pubDate>\n` +
          '</item>',
      )
      .join('\n') +
    '\n</channel>\n</rss>\n'
  );
};

export const toAtomXml = (options: {
  id: string; // site id URI
  title: string;
  link: string; // site link
  feedLink: string; // self link to atom.xml
  updated: Date;
  entries: {
    id: string;
    title: string;
    link: string;
    summary: string;
    updated: Date;
  }[];
}): string => {
  const { id, title, link, feedLink, updated, entries } = options;
  return (
    `<?xml version="1.0" encoding="utf-8"?>\n` +
    `<feed xmlns="http://www.w3.org/2005/Atom">\n` +
    `<id>${escapeXml(id)}</id>\n` +
    `<title>${escapeXml(title)}</title>\n` +
    `<updated>${updated.toISOString()}</updated>\n` +
    `<link href="${escapeXml(link)}" rel="alternate"/>\n` +
    `<link href="${escapeXml(feedLink)}" rel="self" type="application/atom+xml"/>\n` +
    entries
      .map(
        (e) =>
          '<entry>\n' +
          `<id>${escapeXml(e.id)}</id>\n` +
          `<title>${escapeXml(e.title)}</title>\n` +
          `<link href="${escapeXml(e.link)}"/>\n` +
          `<updated>${e.updated.toISOString()}</updated>\n` +
          `<summary type="html"><![CDATA[${e.summary}]]></summary>\n` +
          '</entry>',
      )
      .join('\n') +
    '\n</feed>\n'
  );
};

export const groupOrder = [
  'Breaking',
  'Feature',
  'BugFix',
  'Performance',
  'TechnicalImprovement',
] as const;

type KnownTag = (typeof groupOrder)[number];

export type ChangelogEntry = {
  version: string;
  date: Date;
  // Allow known tags with good tooling, but also tolerate any other tag keys present in the changelog
  groups: Record<string, string[]> & Partial<Record<KnownTag, string[]>>;
};

const groupTitle: Record<(typeof groupOrder)[number], string> = {
  Breaking: 'Breaking changes',
  Feature: 'Features',
  BugFix: 'Bug fixes',
  Performance: 'Performance',
  TechnicalImprovement: 'Technical improvements',
};

export const buildItemsFromChangelog = (
  entries: ChangelogEntry[],
  baseUrl: string,
  maxItems = 20,
): {
  id: string;
  title: string;
  link: string;
  description: string;
  pubDate: Date;
}[] => {
  // Use shared makeSectionId for consistency across renderer and feeds

  const items: {
    id: string;
    title: string;
    link: string;
    description: string;
    pubDate: Date;
  }[] = [];

  for (const entry of entries) {
    // Build one feed item per release, bundling all groups inside the description
    const sections: string[] = [];

    // Known groups in desired order first
    for (const tag of groupOrder) {
      const groupItems = entry.groups[tag] ?? [];
      if (!groupItems.length) {
        continue;
      }

      const texts = tag === 'Breaking' ? [groupItems[0]] : groupItems;
      const listItems = texts.map((t) => `<li>${escapeXml(t)}</li>`).join('');
      sections.push(
        `<p><strong>${escapeXml(groupTitle[tag])}</strong></p><ul>${listItems}</ul>`,
      );
    }

    // Include any unknown tags (if present) after known groups, in stable key order
    const knownSet = new Set<string>(groupOrder as readonly string[]);
    const unknownTags = Object.keys(entry.groups)
      .filter((k) => !knownSet.has(k) && (entry.groups[k]?.length ?? 0) > 0)
      .sort();
    for (const tag of unknownTags) {
      const groupItems = entry.groups[tag] ?? [];
      const listItems = groupItems
        .map((t) => `<li>${escapeXml(t)}</li>`)
        .join('');
      sections.push(
        `<p><strong>${escapeXml(tag)}</strong></p><ul>${listItems}</ul>`,
      );
    }

    if (!sections.length) {
      continue;
    }

    const title = `Version ${entry.version}`;
    const id = `version:${entry.version}`; // single entry per version
    const link = `${baseUrl}/latest-updates#${makeSectionId(entry.version)}`;
    const description = sections.join('');

    items.push({ id, title, link, description, pubDate: entry.date });
    if (items.length >= maxItems) {
      return items;
    }
  }

  return items;
};

// Common utility to generate stable section IDs for versions
export const makeSectionId = (version: string): string => {
  const semverMatch = version.match(/(\d+\.\d+\.\d+)/);
  if (semverMatch) {
    const [major, minor, patch] = parseAppVersion(semverMatch[1]);
    if (
      Number.isFinite(major) &&
      Number.isFinite(minor) &&
      Number.isFinite(patch)
    ) {
      return `version-${major}-${minor}-${patch}`;
    }
  }
  return `version-${version}`
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/\.+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};
