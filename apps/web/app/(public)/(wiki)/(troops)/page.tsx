import { WikiArticlePage } from '../components/wiki-article-page';
import { wikiTopics } from '../wiki-topics';
import TroopsMdx from './troops.mdx';

const TroopsPage = () => (
  <WikiArticlePage title={wikiTopics.troops.title}>
    <TroopsMdx />
  </WikiArticlePage>
);

export default TroopsPage;
