import { WikiArticlePage } from '../components/wiki-article-page';
import { wikiTopics } from '../wiki-topics';
import BuildingsMdx from './buildings.mdx';

const BuildingsPage = () => (
  <WikiArticlePage title={wikiTopics.buildings.title}>
    <BuildingsMdx />
  </WikiArticlePage>
);

export default BuildingsPage;
