import { WikiArticlePage } from '../components/wiki-article-page';
import { wikiTopics } from '../wiki-topics';
import IntroductionMdx from './introduction.mdx';

const IntroductionPage = () => (
  <WikiArticlePage title={wikiTopics.introduction.title}>
    <IntroductionMdx />
  </WikiArticlePage>
);

export default IntroductionPage;
