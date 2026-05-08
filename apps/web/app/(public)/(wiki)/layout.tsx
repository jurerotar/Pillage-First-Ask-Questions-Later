import { FaChevronDown } from 'react-icons/fa';
import { Outlet } from 'react-router';
import { useMediaQuery } from 'app/(game)/(village-slug)/hooks/dom/use-media-query';
import { WikiMainNavigation } from './components/wiki-main-navigation';

const WikiLayout = () => {
  const isLargeScreen = useMediaQuery('(min-width: 1024px)');

  return (
    <div className="max-w-7xl mx-auto px-2 w-full">
      <div className="flex flex-col lg:flex-row gap-2 lg:gap-8 justify-center">
        <aside className="w-full lg:w-64 lg:shrink-0 lg:sticky lg:top-4 h-fit z-10">
          {!isLargeScreen ? (
            <details className="bg-background border rounded-lg overflow-hidden group">
              <summary className="px-4 py-2 cursor-pointer font-medium list-none flex items-center justify-between hover:bg-muted/50 transition-colors">
                <span>Wiki</span>
                <span className="group-open:rotate-180 transition-transform text-muted-foreground">
                  <FaChevronDown />
                </span>
              </summary>
              <div className="p-4 border-t">
                <WikiMainNavigation showTitle={false} />
              </div>
            </details>
          ) : (
            <WikiMainNavigation />
          )}
        </aside>

        <main className="flex-1 max-w-3xl w-full">
          <Outlet />
        </main>

        <div className="hidden lg:block lg:w-64 lg:shrink-0" />
      </div>
    </div>
  );
};

export default WikiLayout;
