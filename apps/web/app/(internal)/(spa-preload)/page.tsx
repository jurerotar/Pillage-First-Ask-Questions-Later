import { PrefetchPageLinks } from 'react-router';
import { PageContents } from 'app/components/page-contents';
import { getGameRoutePaths } from 'app/utils/react-router';

const SPAPreloadPage = () => {
  const gamePagesToPrerender = getGameRoutePaths();

  return (
    <PageContents>
      {gamePagesToPrerender.map((page) => (
        <PrefetchPageLinks
          data-prefetch-page={page}
          key={page}
          page={page}
        />
      ))}
    </PageContents>
  );
};

export default SPAPreloadPage;
