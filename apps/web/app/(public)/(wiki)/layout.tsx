import { LuChevronDown } from 'react-icons/lu';
import { Outlet } from 'react-router';
import { WikiMainNavigation } from './components/wiki-main-navigation';

const WikiLayout = () => {
  return (
    <div className="max-w-7xl mx-auto px-2 w-full">
      <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,48rem)_16rem] lg:gap-8 lg:justify-center">
        <aside className="lg:sticky lg:top-4 h-fit">
          <details className="bg-card border border-border rounded-md overflow-hidden group lg:hidden">
            <summary className="px-4 py-2 cursor-pointer font-medium list-none flex items-center justify-between hover:bg-muted/50 transition-colors">
              <span>Wiki</span>
              <LuChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <div className="p-3 border-t border-border">
              <WikiMainNavigation showTitle={false} />
            </div>
          </details>
          <div className="hidden lg:block">
            <WikiMainNavigation />
          </div>
        </aside>
        <main className="min-w-0">
          <Outlet />
        </main>
        <div className="hidden lg:block" />
      </div>
    </div>
  );
};

export default WikiLayout;
