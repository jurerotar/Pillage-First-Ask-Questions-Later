import { clsx } from 'clsx';
import { Tabs as TabsPrimitive } from 'radix-ui';
import {
  Children,
  type ComponentProps,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'app/components/ui/popover';

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

  return (
    <TabsContext.Provider
      value={{ onValueChange: handleValueChange, value: currentValue }}
    >
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

type OverflowTab = {
  value: string;
  label: string;
};

export const TabList = ({
                          children,
                          className,
                          ...props
                        }: ComponentProps<typeof TabsPrimitive.List>) => {
  const tabsContext = useContext(TabsContext);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState<number | null>(null);
  const [overflowTabs, setOverflowTabs] = useState<OverflowTab[]>([]);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const childArray = Children.toArray(children).filter(isValidElement);

  const calculateOverflow = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const containerWidth = container.offsetWidth;
    const tabElements = Array.from(
      container.querySelectorAll<HTMLElement>('[data-slot="tab"]'),
    );
    const moreButton = container.querySelector<HTMLElement>(
      '[data-slot="tab-more"]',
    );

    if (tabElements.length === 0) {
      return;
    }

    // Temporarily show all tabs and hide "More" to measure natural sizes
    for (const tab of tabElements) {
      tab.style.display = '';
    }
    if (moreButton) {
      moreButton.style.display = 'none';
    }

    // Measure each tab's width individually
    const tabWidths: number[] = [];
    for (const el of tabElements) {
      tabWidths.push(el.offsetWidth);
    }

    // Check if everything fits on one line
    let totalWidth = 0;
    for (const w of tabWidths) {
      totalWidth += w;
    }

    // Account for gap between items (gap-1 = 0.25rem = 4px typically)
    const gap = 4;
    const totalWithGaps = totalWidth + gap * (tabElements.length - 1);

    if (totalWithGaps <= containerWidth) {
      setVisibleCount(null);
      setOverflowTabs([]);
      return;
    }

    // Measure More button width
    if (moreButton) {
      moreButton.style.display = '';
    }
    const moreWidth = (moreButton?.offsetWidth ?? 80) + gap;

    // Find how many tabs fit alongside the More button
    let usedWidth = moreWidth;
    let count = 0;

    for (const w of tabWidths) {
      if (usedWidth + w + gap <= containerWidth) {
        usedWidth += w + gap;
        count++;
      } else {
        break;
      }
    }

    // Ensure at least 1 tab is visible
    count = Math.max(1, count);
    setVisibleCount(count);

    // Hide overflow tabs in the DOM
    for (let i = count; i < tabElements.length; i++) {
      tabElements[i].style.display = 'none';
    }

    // Extract overflow tab data from the DOM
    const overflow: OverflowTab[] = [];
    for (let i = count; i < tabElements.length; i++) {
      const el = tabElements[i];
      const tabValue = el.getAttribute('data-value') ?? '';
      if (tabValue) {
        overflow.push({
          value: tabValue,
          label: el.textContent ?? '',
        });
      }
    }
    setOverflowTabs(overflow);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const observer = new ResizeObserver(() => {
      calculateOverflow();
    });

    observer.observe(container);
    calculateOverflow();

    return () => {
      observer.disconnect();
    };
  }, [calculateOverflow]);

  // Recalculate when the number of children changes (e.g. dynamic tabs)
  const childCount = childArray.length;
  // biome-ignore lint/correctness/useExhaustiveDependencies: childCount is an intentional trigger for dynamic tab changes
  useEffect(() => {
    calculateOverflow();
  }, [childCount, calculateOverflow]);

  const hasOverflow = visibleCount !== null && overflowTabs.length > 0;
  const isOverflowActive =
    hasOverflow &&
    tabsContext &&
    overflowTabs.some((tab) => tab.value === tabsContext.value);

  return (
    <TabsPrimitive.List
      ref={containerRef}
      className={clsx(
        'inline-flex max-w-full items-center gap-1 overflow-hidden rounded-lg bg-muted p-1 text-muted-foreground transition-colors',
        className,
      )}
      {...props}
    >
      {children}
      {hasOverflow && (
        <Popover
          open={isMoreOpen}
          onOpenChange={setIsMoreOpen}
        >
          <PopoverTrigger
            data-slot="tab-more"
            className={clsx(
              'inline-flex items-center justify-center gap-1 rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap transition-all outline-none cursor-pointer',
              'hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50',
              isOverflowActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground',
            )}
          >
            More
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
      {!hasOverflow && (
        <div
          data-slot="tab-more"
          className="hidden"
        />
      )}
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
      className={clsx(
        'inline-flex items-center justify-center rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap transition-all cursor-pointer',
        'text-foreground/70 hover:text-foreground',
        'focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none',
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        className,
      )}
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
