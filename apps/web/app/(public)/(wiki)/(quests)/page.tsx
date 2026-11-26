import { WikiArticlePage } from '../components/wiki-article-page';
import { wikiTopics } from '../wiki-topics';
import QuestsMdx from './quests.mdx';

const QuestsPage = () => (
  <WikiArticlePage title={wikiTopics.quests.title}>
    <QuestsMdx />
  </WikiArticlePage>
);

export default QuestsPage;
