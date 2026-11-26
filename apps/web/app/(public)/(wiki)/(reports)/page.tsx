import { WikiArticlePage } from '../components/wiki-article-page';
import { wikiTopics } from '../wiki-topics';
import ReportsMdx from './reports.mdx';

const ReportsPage = () => (
  <WikiArticlePage title={wikiTopics.reports.title}>
    <ReportsMdx />
  </WikiArticlePage>
);

export default ReportsPage;
