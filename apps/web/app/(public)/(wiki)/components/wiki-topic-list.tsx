import { Link } from 'react-router';
import { wikiTopics } from '../wiki-topics';

export const WikiTopicList = () => (
  <ul className="list-disc ml-4 flex flex-col gap-1 my-2">
    {Object.entries(wikiTopics).map(([slug, { title, summary }]) => (
      <li
        className="text-foreground leading-6"
        key={slug}
      >
        <Link
          className="text-link font-medium underline"
          to={`/wiki/${slug}`}
        >
          {title}
        </Link>{' '}
        - {summary}
      </li>
    ))}
  </ul>
);
