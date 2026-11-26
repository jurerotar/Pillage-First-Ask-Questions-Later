import { WikiArticlePage } from '../components/wiki-article-page';
import { wikiTopics } from '../wiki-topics';
import ResourcesMdx from './resources.mdx';

const ResourcesPage = () => (
  <WikiArticlePage title={wikiTopics.resources.title}>
    <ResourcesMdx />
  </WikiArticlePage>
);

export default ResourcesPage;
