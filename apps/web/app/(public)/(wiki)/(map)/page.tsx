import { WikiArticlePage } from '../components/wiki-article-page';
import { wikiTopics } from '../wiki-topics';
import MapMdx from './map.mdx';

const MapPage = () => (
  <WikiArticlePage title={wikiTopics.map.title}>
    <MapMdx />
  </WikiArticlePage>
);

export default MapPage;
