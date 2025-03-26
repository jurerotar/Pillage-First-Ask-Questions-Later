import { useRouteSegments } from 'app/(game)/(village-slug)/hooks/routes/use-route-segments';

const QuestPage = () => {
  const { questId: _questId } = useRouteSegments();

  return <>Individual quest page</>;
};

export default QuestPage;
