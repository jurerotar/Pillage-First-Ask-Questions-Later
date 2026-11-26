import { WikiArticlePage } from '../components/wiki-article-page';
import { wikiTopics } from '../wiki-topics';
import VillagesMdx from './villages.mdx';

const VillagesPage = () => (
  <WikiArticlePage title={wikiTopics.villages.title}>
    <VillagesMdx />
  </WikiArticlePage>
);

export default VillagesPage;
