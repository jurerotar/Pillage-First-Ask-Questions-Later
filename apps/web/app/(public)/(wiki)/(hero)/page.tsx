import { WikiArticlePage } from '../components/wiki-article-page';
import { wikiTopics } from '../wiki-topics';
import HeroMdx from './hero.mdx';

const HeroPage = () => (
  <WikiArticlePage title={wikiTopics.hero.title}>
    <HeroMdx />
  </WikiArticlePage>
);

export default HeroPage;
