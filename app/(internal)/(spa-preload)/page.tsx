import { PrefetchPageLinks } from 'react-router';

const PAGES_TO_INCLUDE_PRELOADS_ON = [
  '/game/server-slug/village-slug/resources',
  '/game/server-slug/village-slug/resources/building-field-id',
  '/game/server-slug/village-slug/village',
  '/game/server-slug/village-slug/village/building-field-id',
  '/game/server-slug/village-slug/map',
  '/game/server-slug/village-slug/hero',
  '/game/server-slug/village-slug/preferences',
  '/game/server-slug/village-slug/statistics',
  '/game/server-slug/village-slug/overview',
  '/game/server-slug/village-slug/quests',
  '/game/server-slug/village-slug/reports',
  '/game/server-slug/village-slug/reports/report-id',
];

const SPAPreloadPage = () => {
  return (
    <>
      {PAGES_TO_INCLUDE_PRELOADS_ON.map((page) => (
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
