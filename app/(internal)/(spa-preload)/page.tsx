import { PrefetchPageLinks } from 'react-router';
import { getGameRoutePaths } from 'app/utils/react-router';

const SPAPreloadPage = () => {
  const gamePagesToPrerender = getGameRoutePaths();

  return (
    <>
      {gamePagesToPrerender.map((page) => (
        <PrefetchPageLinks
          data-prefetch-page={page}
          key={page}
          page={page}
        />
      ))}
    </>
  );
};

export default SPAPreloadPage;
