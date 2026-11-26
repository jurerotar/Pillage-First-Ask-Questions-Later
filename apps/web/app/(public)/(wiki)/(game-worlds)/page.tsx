import { WikiArticlePage } from '../components/wiki-article-page';
import { wikiTopics } from '../wiki-topics';
import GameWorldsMdx from './game-worlds.mdx';

const GameWorldsPage = () => (
  <WikiArticlePage title={wikiTopics['game-worlds'].title}>
    <GameWorldsMdx />
  </WikiArticlePage>
);

export default GameWorldsPage;
