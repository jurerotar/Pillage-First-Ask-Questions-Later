import { clsx } from 'clsx';
import {
  type CSSProperties,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { units } from '@pillage-first/game-assets/units';
import type { Unit } from '@pillage-first/types/models/unit';
import { Icon } from 'app/components/icon';
import {
  type IconType,
  unitIdToUnitIconMapper,
} from 'app/components/icons/icons';
import iconClassesSource from 'app/components/icons/icons.module.scss?raw';
import { Button } from 'app/components/ui/button';
import styles from './horse.module.scss';

type CavalryTribe =
  | 'romans'
  | 'gauls'
  | 'teutons'
  | 'egyptians'
  | 'huns'
  | 'spartans'
  | 'natars';
type CavalryUnit = Extract<Unit, { category: 'cavalry' }> & {
  tribe: CavalryTribe;
};
type HorsePartKey =
  | 'base'
  | 'baseBottom'
  | 'baseMiddle'
  | 'earsBack'
  | 'earsFront'
  | 'eye'
  | 'eyeLidBottom'
  | 'eyeLidMiddle'
  | 'eyeLidTop'
  | 'eyeLidTopDetail'
  | 'eyePupil'
  | 'headFront'
  | 'maneBack'
  | 'maneFront'
  | 'mouthLine'
  | 'nose'
  | 'noseDetail'
  | 'harnessRope';
type HorseColorSet = Record<HorsePartKey, string>;
type HorseColorsByClass = Record<string, HorseColorSet>;
type HorseColorOverrides = Partial<HorseColorSet>;
type HorseColorOverridesByClass = Record<string, HorseColorOverrides>;
type UpdateHorseColorSet = (className: string, colors: HorseColorSet) => void;
type HorseColorControl = {
  key: string;
  label: string;
  partKeys: HorsePartKey[];
};

const horseParts: {
  key: HorsePartKey;
  label: string;
  cssVariable: `--${string}`;
}[] = [
  { key: 'base', label: 'Base', cssVariable: '--base-color' },
  {
    key: 'baseBottom',
    label: 'Base bottom',
    cssVariable: '--base-bottom-color',
  },
  {
    key: 'baseMiddle',
    label: 'Base middle',
    cssVariable: '--base-middle-color',
  },
  {
    key: 'earsBack',
    label: 'Ears back',
    cssVariable: '--ears-back-color',
  },
  {
    key: 'earsFront',
    label: 'Ears front',
    cssVariable: '--ears-front-color',
  },
  { key: 'eye', label: 'Eye', cssVariable: '--eye-color' },
  {
    key: 'eyeLidBottom',
    label: 'Eye lid bottom',
    cssVariable: '--eye-lid-bottom-color',
  },
  {
    key: 'eyeLidMiddle',
    label: 'Eye lid middle',
    cssVariable: '--eye-lid-middle-color',
  },
  {
    key: 'eyeLidTop',
    label: 'Eye lid top',
    cssVariable: '--eye-lid-top-color',
  },
  {
    key: 'eyeLidTopDetail',
    label: 'Eye lid top detail',
    cssVariable: '--eye-lid-top-detail-color',
  },
  {
    key: 'eyePupil',
    label: 'Eye pupil',
    cssVariable: '--eye-pupil-color',
  },
  {
    key: 'headFront',
    label: 'Head front',
    cssVariable: '--head-front-color',
  },
  { key: 'maneBack', label: 'Mane back', cssVariable: '--mane-back-color' },
  {
    key: 'maneFront',
    label: 'Mane front',
    cssVariable: '--mane-front-color',
  },
  { key: 'mouthLine', label: 'Mouth line', cssVariable: '--mouth-line-color' },
  { key: 'nose', label: 'Nose', cssVariable: '--nose-color' },
  {
    key: 'noseDetail',
    label: 'Nose detail',
    cssVariable: '--nose-detail-color',
  },
  {
    key: 'harnessRope',
    label: 'Harness rope',
    cssVariable: '--harness-rope-color',
  },
];
const horsePartByKey = Object.fromEntries(
  horseParts.map((part) => [part.key, part]),
) as Record<HorsePartKey, (typeof horseParts)[number]>;

const horseColorControls: HorseColorControl[] = [
  { key: 'base', label: 'Base', partKeys: ['base'] },
  {
    key: 'baseBottom',
    label: 'Base bottom',
    partKeys: ['baseBottom'],
  },
  {
    key: 'baseMiddle',
    label: 'Base middle',
    partKeys: ['baseMiddle'],
  },
  {
    key: 'earsBack',
    label: 'Ears back',
    partKeys: ['earsBack'],
  },
  {
    key: 'earsFront',
    label: 'Ears front',
    partKeys: ['earsFront'],
  },
  {
    key: 'eye',
    label: 'Eye',
    partKeys: ['eye'],
  },
  {
    key: 'eyeLids',
    label: 'Eye lids',
    partKeys: ['eyeLidBottom', 'eyeLidMiddle', 'eyeLidTop', 'eyeLidTopDetail'],
  },
  {
    key: 'headFront',
    label: 'Head front',
    partKeys: ['headFront'],
  },
  {
    key: 'mane',
    label: 'Mane',
    partKeys: ['maneBack', 'maneFront'],
  },
  { key: 'mouthLine', label: 'Mouth line', partKeys: ['mouthLine'] },
  { key: 'nose', label: 'Nose', partKeys: ['nose'] },
  {
    key: 'noseDetail',
    label: 'Nose detail',
    partKeys: ['noseDetail'],
  },
  {
    key: 'harnessRope',
    label: 'Harness ropes',
    partKeys: ['harnessRope'],
  },
];
const joinedHorsePartGroups: HorsePartKey[][] = [
  ['eyeLidBottom', 'eyeLidMiddle', 'eyeLidTop', 'eyeLidTopDetail'],
  ['maneBack', 'maneFront'],
];

const normalizeHorseColorSet = (colors: HorseColorSet): HorseColorSet => {
  const normalizedColors = { ...colors };

  joinedHorsePartGroups.forEach(([sourceKey, ...joinedKeys]) => {
    joinedKeys.forEach((joinedKey) => {
      normalizedColors[joinedKey] = normalizedColors[sourceKey];
    });
  });

  return normalizedColors;
};

const tribeLabels: Record<CavalryTribe, string> = {
  romans: 'Romans',
  gauls: 'Gauls',
  teutons: 'Teutons',
  egyptians: 'Egyptians',
  huns: 'Huns',
  spartans: 'Spartans',
  natars: 'Natars',
};

const tribeOrder: CavalryTribe[] = [
  'romans',
  'gauls',
  'teutons',
  'egyptians',
  'huns',
  'spartans',
  'natars',
];

const cavalryUnits = units.filter(
  (unit): unit is CavalryUnit =>
    unit.category === 'cavalry' &&
    tribeOrder.includes(unit.tribe as CavalryTribe),
);

const toClassName = (unitId: Unit['id']) => {
  return unitId.toLowerCase().replaceAll('_', '-');
};

const toUnitLabel = (unitId: Unit['id']) => {
  return unitId
    .toLowerCase()
    .split('_')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');
};

const normalizeColor = (color: string) => {
  return color.toLowerCase() === 'black' ? '#000000' : color;
};

const serializeColor = (color: string) => {
  return color.toLowerCase() === '#000000' ? 'black' : color;
};

const parseInitialHorseColors = (): HorseColorsByClass => {
  const classPattern =
    /\.([a-z0-9-]+)\s*\{\s*@include\s+horseIconColorSet\(([^)]*)\)/g;
  const matches = iconClassesSource.matchAll(classPattern);

  return Object.fromEntries(
    [...matches].flatMap<[string, HorseColorSet]>((match) => {
      const [, className, colorList] = match;
      const colorValues = colorList
        .split(',')
        .map((color) => normalizeColor(color.trim()));

      if (colorValues.length < horseParts.length) {
        return [];
      }

      const colors = Object.fromEntries(
        horseParts.map(({ key }, index) => [key, colorValues[index]]),
      ) as HorseColorSet;

      return [[className, normalizeHorseColorSet(colors)]];
    }),
  );
};

const initialHorseColorsByClass = parseInitialHorseColors();

const getInitialHorseColors = (className: string): HorseColorSet => {
  const colors = initialHorseColorsByClass[className];

  if (colors === undefined) {
    throw new Error(
      `Missing horse icon color defaults for .${className} in icons.module.scss.`,
    );
  }

  return colors;
};

const initialCavalryColors = Object.fromEntries(
  cavalryUnits.map((unit) => {
    const className = toClassName(unit.id);

    return [className, getInitialHorseColors(className)];
  }),
);

const horseColorsStorageKey = 'pillage-first:cavalry-icon-colors:v1';
const horseColorsStorageDebounceMs = 300;
const horseColorStateCommitDebounceMs = 50;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const mergeHorseColorSet = (
  persistedColors: unknown,
  fallbackColors: HorseColorSet,
): HorseColorSet => {
  if (!isRecord(persistedColors)) {
    return fallbackColors;
  }

  const colors = { ...fallbackColors };

  horseParts.forEach(({ key }) => {
    const persistedColor = persistedColors[key];

    if (typeof persistedColor === 'string') {
      colors[key] = normalizeColor(persistedColor);
    }
  });
  return normalizeHorseColorSet(colors);
};

const normalizePersistedCavalryColors = (
  persistedColors: Record<string, unknown>,
): HorseColorsByClass => {
  return Object.fromEntries(
    cavalryUnits.map((unit) => {
      const className = toClassName(unit.id);
      const fallbackColors = getInitialHorseColors(className);

      return [
        className,
        mergeHorseColorSet(persistedColors[className], fallbackColors),
      ];
    }),
  );
};

const getCavalryColorOverrides = (
  colorsByClass: HorseColorsByClass,
): HorseColorOverridesByClass => {
  return Object.fromEntries(
    cavalryUnits.flatMap<[string, HorseColorOverrides]>((unit) => {
      const className = toClassName(unit.id);
      const defaultColors = getInitialHorseColors(className);
      const colors = normalizeHorseColorSet(
        colorsByClass[className] ?? defaultColors,
      );
      const overrides: HorseColorOverrides = {};

      horseParts.forEach(({ key }) => {
        if (colors[key].toLowerCase() !== defaultColors[key].toLowerCase()) {
          overrides[key] = colors[key];
        }
      });

      return Object.keys(overrides).length === 0
        ? []
        : [[className, overrides]];
    }),
  );
};

const getStoredCavalryColors = (): HorseColorsByClass => {
  if (typeof window === 'undefined') {
    return initialCavalryColors;
  }

  try {
    const persistedColors = window.localStorage.getItem(horseColorsStorageKey);

    if (persistedColors === null) {
      return initialCavalryColors;
    }

    const parsedColors: unknown = JSON.parse(persistedColors);

    if (!isRecord(parsedColors)) {
      return initialCavalryColors;
    }

    return normalizePersistedCavalryColors(parsedColors);
  } catch {
    return initialCavalryColors;
  }
};

const storeCavalryColors = (colorsByClass: HorseColorsByClass) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const overridesByClass = getCavalryColorOverrides(colorsByClass);

    if (Object.keys(overridesByClass).length === 0) {
      window.localStorage.removeItem(horseColorsStorageKey);
      return;
    }

    window.localStorage.setItem(
      horseColorsStorageKey,
      JSON.stringify(overridesByClass),
    );
  } catch {
    // Persistence is best-effort for this design-system tool.
  }
};

const getLocalStorageExport = (colorsByClass: HorseColorsByClass) => {
  const overridesByClass = getCavalryColorOverrides(colorsByClass);

  return JSON.stringify(
    {
      [horseColorsStorageKey]: JSON.stringify(overridesByClass),
    },
    null,
    2,
  );
};

const parseLocalStorageImport = (
  importedStorage: string,
): HorseColorsByClass => {
  const parsedImport: unknown = JSON.parse(importedStorage);

  if (!isRecord(parsedImport)) {
    throw new Error('Color import must be a JSON object.');
  }

  const exportedStorageValue = parsedImport[horseColorsStorageKey];

  if (typeof exportedStorageValue === 'string') {
    const parsedStorageValue: unknown = JSON.parse(exportedStorageValue);

    if (!isRecord(parsedStorageValue)) {
      throw new Error('Saved color value must be a JSON object.');
    }

    return normalizePersistedCavalryColors(parsedStorageValue);
  }

  return normalizePersistedCavalryColors(parsedImport);
};

const getHorseStyle = (colors: HorseColorSet) => {
  return Object.fromEntries(
    horseParts.map(({ key, cssVariable }) => [cssVariable, colors[key]]),
  ) as CSSProperties;
};

const getClassesSource = (colorsByClass: HorseColorsByClass) => {
  return cavalryUnits
    .map((unit) => {
      const className = toClassName(unit.id);
      const colors = normalizeHorseColorSet(
        colorsByClass[className] ?? getInitialHorseColors(className),
      );
      const mixinColors = horseParts
        .map(({ key }) => serializeColor(colors[key]))
        .join(', ');

      return `.${className} {\n  @include horseIconColorSet(${mixinColors})\n}`;
    })
    .join('\n\n');
};

const CavalryUnitColorCard = memo(
  ({
    className,
    colors,
    defaultColors,
    iconType,
    onColorsChange,
    unit,
  }: {
    className: string;
    colors: HorseColorSet;
    defaultColors: HorseColorSet;
    iconType: IconType;
    onColorsChange: UpdateHorseColorSet;
    unit: CavalryUnit;
  }) => {
    const previewRef = useRef<HTMLDivElement>(null);
    const inputRefs = useRef<Record<string, HTMLInputElement>>({});
    const pendingColorsRef = useRef(colors);
    const commitTimeoutRef = useRef<number | null>(null);

    const clearCommitTimeout = useCallback(() => {
      if (commitTimeoutRef.current === null) {
        return;
      }

      window.clearTimeout(commitTimeoutRef.current);
      commitTimeoutRef.current = null;
    }, []);

    const commitPendingColors = useCallback(() => {
      clearCommitTimeout();
      onColorsChange(className, { ...pendingColorsRef.current });
    }, [className, clearCommitTimeout, onColorsChange]);

    const scheduleCommit = useCallback(() => {
      clearCommitTimeout();

      commitTimeoutRef.current = window.setTimeout(() => {
        commitTimeoutRef.current = null;
        onColorsChange(className, { ...pendingColorsRef.current });
      }, horseColorStateCommitDebounceMs);
    }, [className, clearCommitTimeout, onColorsChange]);

    const resetColors = useCallback(() => {
      clearCommitTimeout();
      pendingColorsRef.current = defaultColors;

      horseParts.forEach(({ key, cssVariable }) => {
        previewRef.current?.style.setProperty(cssVariable, defaultColors[key]);
      });

      horseColorControls.forEach(({ key, partKeys }) => {
        const color = defaultColors[partKeys[0]];

        const input = inputRefs.current[key];

        if (input !== undefined) {
          input.value = color;
        }
      });

      onColorsChange(className, { ...defaultColors });
    }, [className, clearCommitTimeout, defaultColors, onColorsChange]);

    useEffect(() => {
      pendingColorsRef.current = colors;

      horseParts.forEach(({ key, cssVariable }) => {
        previewRef.current?.style.setProperty(cssVariable, colors[key]);
      });

      horseColorControls.forEach(({ key, partKeys }) => {
        const input = inputRefs.current[key];

        if (input !== undefined) {
          input.value = colors[partKeys[0]];
        }
      });
    }, [colors]);

    useEffect(() => {
      return () => {
        clearCommitTimeout();
      };
    }, [clearCommitTimeout]);

    return (
      <article className="rounded-md border bg-background p-4">
        <div className="flex gap-4">
          <div className="flex w-24 shrink-0 flex-col gap-2">
            <div
              ref={previewRef}
              className="flex size-24 items-center justify-center rounded-md border bg-muted"
              style={getHorseStyle(colors)}
            >
              <Icon
                type={iconType}
                className={clsx(styles.horse, 'size-full')}
              />
            </div>
            <Button
              className="w-full whitespace-normal px-2 py-1 text-xs leading-tight"
              size="fit"
              variant="outline"
              onClick={resetColors}
            >
              Reset to default
            </Button>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-semibold">{toUnitLabel(unit.id)}</h3>
            <p className="text-xs text-muted-foreground">.{className}</p>

            <div className="mt-3 grid gap-2">
              {horseColorControls.map(({ key, label, partKeys }) => (
                <label
                  key={key}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span>{label}</span>
                  <input
                    ref={(element) => {
                      if (element === null) {
                        delete inputRefs.current[key];
                        return;
                      }

                      inputRefs.current[key] = element;
                    }}
                    type="color"
                    defaultValue={colors[partKeys[0]]}
                    onBlur={commitPendingColors}
                    onChange={(event) => {
                      const color = event.target.value;
                      const nextColors = { ...pendingColorsRef.current };

                      partKeys.forEach((partKey) => {
                        const { cssVariable } = horsePartByKey[partKey];

                        nextColors[partKey] = color;
                        previewRef.current?.style.setProperty(
                          cssVariable,
                          color,
                        );
                      });
                      pendingColorsRef.current = nextColors;
                      scheduleCommit();
                    }}
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      </article>
    );
  },
);

const CavalryColorPicker = () => {
  const [colorsByClass, setColorsByClass] =
    useState<HorseColorsByClass>(initialCavalryColors);
  const [storageStatus, setStorageStatus] = useState<string | null>(null);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    setColorsByClass(getStoredCavalryColors());
  }, []);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      storeCavalryColors(colorsByClass);
    }, horseColorsStorageDebounceMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [colorsByClass]);

  const updateColors = useCallback<UpdateHorseColorSet>((className, colors) => {
    setColorsByClass((currentColorsByClass) => ({
      ...currentColorsByClass,
      [className]: colors,
    }));
  }, []);

  const copyClasses = async () => {
    await navigator.clipboard.writeText(getClassesSource(colorsByClass));
  };

  const copyLocalStorageExport = async () => {
    try {
      storeCavalryColors(colorsByClass);
      await navigator.clipboard.writeText(getLocalStorageExport(colorsByClass));
      setStorageStatus('Copied localStorage export to clipboard.');
    } catch {
      setStorageStatus('Could not copy localStorage export.');
    }
  };

  const overwriteLocalStorage = () => {
    if (typeof window === 'undefined') {
      return;
    }

    const importedStorage = window.prompt(
      `Paste the ${horseColorsStorageKey} localStorage export:`,
    );

    if (importedStorage === null) {
      return;
    }

    try {
      const nextColorsByClass = parseLocalStorageImport(importedStorage);

      storeCavalryColors(nextColorsByClass);
      setColorsByClass(nextColorsByClass);
      setStorageStatus('Overwrote localStorage colors from import.');
    } catch {
      setStorageStatus('Import failed. Paste a valid color picker export.');
    }
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-semibold">Cavalry icon colors</h1>
          <p className="text-sm text-muted-foreground">
            Defaults come from icons.module.scss. Local storage contains only
            your overrides.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button
              size="fit"
              variant="outline"
              onClick={copyLocalStorageExport}
            >
              Copy localStorage
            </Button>
            <Button
              size="fit"
              variant="outline"
              onClick={overwriteLocalStorage}
            >
              Overwrite localStorage
            </Button>
            <Button
              size="fit"
              onClick={copyClasses}
            >
              Copy classes
            </Button>
          </div>
          {storageStatus !== null && (
            <p className="max-w-md text-xs text-muted-foreground sm:text-right">
              {storageStatus}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {tribeOrder.map((tribe) => {
          const tribeUnits = cavalryUnits.filter(
            (unit) => unit.tribe === tribe,
          );

          return (
            <section
              key={tribe}
              className="flex flex-col gap-3"
            >
              <div>
                <h2 className="text-xl font-semibold">{tribeLabels[tribe]}</h2>
                <p className="text-sm text-muted-foreground">
                  {tribeUnits.length} cavalry icon
                  {tribeUnits.length === 1 ? '' : 's'}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {tribeUnits.map((unit) => {
                  const className = toClassName(unit.id);
                  const defaultColors = getInitialHorseColors(className);
                  const colors = colorsByClass[className] ?? defaultColors;
                  const iconType = unitIdToUnitIconMapper(unit.id) as IconType;

                  return (
                    <CavalryUnitColorCard
                      key={unit.id}
                      className={className}
                      colors={colors}
                      defaultColors={defaultColors}
                      iconType={iconType}
                      onColorsChange={updateColors}
                      unit={unit}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

const ColorPickerPage = () => {
  return (
    <>
      <title>Design system - Icon color picker | Pillage First!</title>
      <main className="flex flex-col">
        <section className="container relative mx-auto flex py-4">
          <CavalryColorPicker />
        </section>
      </main>
    </>
  );
};

export default ColorPickerPage;
