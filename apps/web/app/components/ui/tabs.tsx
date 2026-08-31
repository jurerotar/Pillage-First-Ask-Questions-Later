import { clsx } from 'clsx';
import { Tabs as TabsPrimitive } from 'radix-ui';
import {
  Children,
  type ComponentProps,
  createContext,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'app/components/ui/popover';

const TAB_GAP_WIDTH = 4;
const MORE_BUTTON_FALLBACK_WIDTH = 80;

const tabClassName = clsx(
  'inline-flex items-center justify-center rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap transition-all cursor-pointer',
  'text-foreground/70 hover:text-foreground',
  'focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none',
  'disabled:pointer-events-none disabled:opacity-50',
  'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
);

const getMoreButtonClassName = (isActive: boolean) => {
  return clsx(
    'inline-flex items-center justify-center gap-1 rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap transition-all outline-none cursor-pointer',
    'hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50',
    isActive
      ? 'bg-background text-foreground shadow-sm'
      : 'text-muted-foreground',
  );
};

type TabsContextValue = {
  onValueChange: (value: string) => void;
  value: string;
};

const TabsContext = createContext<TabsContextValue | null>(null);

type TabsProps = ComponentProps<typeof TabsPrimitive.Root>;

export const Tabs = ({
  children,
  value,
  onValueChange,
  defaultValue,
  ...props
}: TabsProps) => {
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const currentValue = value ?? internalValue;

  const handleValueChange = useCallback(
    (newValue: string) => {
      if (value === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    },
    [value, onValueChange],
  );
  const contextValue = useMemo(
    () => ({ onValueChange: handleValueChange, value: currentValue }),
    [currentValue, handleValueChange],
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <TabsPrimitive.Root
        value={currentValue}
        onValueChange={handleValueChange}
        {...props}
      >
        {children}
      </TabsPrimitive.Root>
    </TabsContext.Provider>
  );
};

type TabElementProps = ComponentProps<typeof TabsPrimitive.Trigger>;

type TabItem = {
  child: ReactElement<TabElementProps>;
  label: ReactNode;
  value: string;
};

const getTabItems = (children: ReactNode): TabItem[] => {
  const items: TabItem[] = [];

  for (const child of Children.toArray(children)) {
    if (!isValidElement<TabElementProps>(child)) {
      continue;
    }

    if (typeof child.props.value !== 'string') {
      continue;
    }

    items.push({
      child,
      label: child.props.children,
      value: child.props.value,
    });
  }

  return items;
};

export const TabList = ({
  children,
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.List>) => {
  const tabsContext = useContext(TabsContext);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState<number | null>(null);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const tabItems = useMemo(() => getTabItems(children), [children]);
  const tabCount = tabItems.length;

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const calculateOverflow = () => {
      const containerWidth = container.offsetWidth;
      const tabElements = container.querySelectorAll<HTMLElement>(
        '[data-slot="tab-measure"]',
      );
      const moreButton = container.querySelector<HTMLElement>(
        '[data-slot="tab-more-measure"]',
      );

      if (
        containerWidth === 0 ||
        tabElements.length === 0 ||
        tabElements.length !== tabCount
      ) {
        return;
      }

      let totalWidth = 0;
      for (const tabElement of tabElements) {
        totalWidth += tabElement.offsetWidth;
      }
      totalWidth += TAB_GAP_WIDTH * Math.max(0, tabElements.length - 1);

      if (totalWidth <= containerWidth) {
        setVisibleCount((currentVisibleCount) => {
          return currentVisibleCount === null ? currentVisibleCount : null;
        });
        return;
      }

      let usedWidth = moreButton?.offsetWidth ?? MORE_BUTTON_FALLBACK_WIDTH;
      let count = 0;

      for (const tabElement of tabElements) {
        const nextWidth = usedWidth + tabElement.offsetWidth + TAB_GAP_WIDTH;

        if (nextWidth > containerWidth) {
          break;
        }

        usedWidth = nextWidth;
        count++;
      }

      const nextVisibleCount = Math.min(
        Math.max(1, count),
        tabElements.length - 1,
      );

      setVisibleCount((currentVisibleCount) => {
        return currentVisibleCount === nextVisibleCount
          ? currentVisibleCount
          : nextVisibleCount;
      });
    };

    const observer = new ResizeObserver(() => {
      calculateOverflow();
    });

    observer.observe(container);
    calculateOverflow();

    return () => {
      observer.disconnect();
    };
  }, [tabCount]);

  const visibleTabs =
    visibleCount === null ? tabItems : tabItems.slice(0, visibleCount);
  const overflowTabs =
    visibleCount === null ? [] : tabItems.slice(visibleCount);
  const hasOverflow = overflowTabs.length > 0;
  const isOverflowActive =
    hasOverflow &&
    tabsContext &&
    overflowTabs.some((tab) => tab.value === tabsContext.value);

  return (
    <TabsPrimitive.List
      ref={containerRef}
      className={clsx(
        'relative inline-flex max-w-full items-center gap-1 overflow-hidden rounded-lg bg-muted p-1 text-muted-foreground transition-colors',
        className,
      )}
      data-slot="tab-list"
      {...props}
    >
      {visibleTabs.map((tab) => tab.child)}
      {hasOverflow && (
        <Popover
          open={isMoreOpen}
          onOpenChange={setIsMoreOpen}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              className={getMoreButtonClassName(Boolean(isOverflowActive))}
              data-slot="tab-more"
            >
              More
              <MoreIcon />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="flex flex-col gap-0.5 p-1"
          >
            {overflowTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={clsx(
                  'w-full rounded-md px-3 py-1.5 text-left text-sm font-medium transition-colors cursor-pointer',
                  'hover:bg-accent hover:text-accent-foreground',
                  'focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                  tabsContext?.value === tab.value
                    ? 'bg-accent text-accent-foreground'
                    : 'text-foreground/70',
                )}
                onClick={() => {
                  tabsContext?.onValueChange(tab.value);
                  setIsMoreOpen(false);
                }}
              >
                {tab.label}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      )}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 flex h-0 max-w-none gap-1 overflow-hidden opacity-0"
      >
        {tabItems.map((tab) => (
          <span
            key={tab.value}
            className={clsx(tabClassName, tab.child.props.className)}
            data-slot="tab-measure"
            data-value={tab.value}
          >
            {tab.label}
          </span>
        ))}
        <span
          className={getMoreButtonClassName(false)}
          data-slot="tab-more-measure"
        >
          More
          <MoreIcon />
        </span>
      </div>
    </TabsPrimitive.List>
  );
};

export const Tab = ({
  children,
  className,
  value,
  ...props
}: ComponentProps<typeof TabsPrimitive.Trigger>) => {
  return (
    <TabsPrimitive.Trigger
      value={value}
      data-slot="tab"
      data-value={value}
      className={clsx(tabClassName, className)}
      {...props}
    >
      {children}
    </TabsPrimitive.Trigger>
  );
};

export const TabPanel = ({
  children,
  className,
  value,
  ...props
}: ComponentProps<typeof TabsPrimitive.Content>) => {
  return (
    <TabsPrimitive.Content
      value={value}
      className={clsx(
        'mt-2 flex-1 border border-border p-2 outline-none',
        className,
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.Content>
  );
};

const MoreIcon = () => {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="size-3.5"
    >
      <path
        fillRule="evenodd"
        d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
};
