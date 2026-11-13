import { clsx } from 'clsx';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaHeart } from 'react-icons/fa';
import {
  GiBreastplate,
  GiBroadsword,
  GiFist,
  GiHorseHead,
  GiShield,
} from 'react-icons/gi';
import { items } from '@pillage-first/game-assets/items';
import type {
  CombatSimulatorHeroItemSlot,
  CombatSimulatorHeroStats,
  CombatSimulatorTroop,
} from '@pillage-first/types/models/combat-simulator';
import type {
  HeroEquipmentItem,
  HeroItem,
} from '@pillage-first/types/models/hero-item';
import { Icon } from 'app/components/icon';
import { Button } from 'app/components/ui/button';
import { Checkbox } from 'app/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'app/components/ui/popover';
import { LevelInputPopover } from './level-input-popover';

const heroItemSlots = [
  {
    slot: 'right-hand',
    icon: <GiBroadsword className="size-4 md:size-5" />,
  },
  {
    slot: 'left-hand',
    icon: <GiShield className="size-4 md:size-5" />,
  },
  {
    slot: 'torso',
    icon: <GiBreastplate className="size-4 md:size-5" />,
  },
] satisfies {
  slot: CombatSimulatorHeroItemSlot;
  icon: ReactNode;
}[];

const heroItemSlotLabels = {
  'right-hand': 'Right hand',
  'left-hand': 'Left hand',
  torso: 'Body armor',
} satisfies Record<CombatSimulatorHeroItemSlot, string>;

const heroEquipmentItems = items.filter((item): item is HeroEquipmentItem => {
  return (
    item.category === 'wearable' &&
    heroItemSlots.some(({ slot }) => slot === item.slot) &&
    (item.heroBonus ?? []).some(({ attribute }) =>
      ['power', 'damageReduction'].includes(attribute),
    )
  );
});

const heroEquipmentItemById = new Map<HeroItem['id'], HeroEquipmentItem>(
  heroEquipmentItems.map((item) => [item.id, item]),
);

const getHeroItemBonus = (
  item: HeroEquipmentItem,
  attribute: 'power' | 'damageReduction',
) => {
  let total = 0;

  for (const bonus of item.heroBonus ?? []) {
    if (bonus.attribute === attribute) {
      total += bonus.value;
    }
  }

  return total;
};

const CombatSimulatorHeroItemSelector = ({
  slot,
  icon,
  selectedItemId,
  onItemChange,
}: {
  slot: CombatSimulatorHeroItemSlot;
  icon: ReactNode;
  selectedItemId: HeroItem['id'] | undefined;
  onItemChange: (
    slot: CombatSimulatorHeroItemSlot,
    itemId?: HeroItem['id'],
  ) => void;
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const slotLabel = t(heroItemSlotLabels[slot]);
  const selectedItem =
    selectedItemId === undefined
      ? undefined
      : heroEquipmentItemById.get(selectedItemId);
  const slotItems = heroEquipmentItems.filter((item) => item.slot === slot);
  const buttonLabel = t('Select {{slot}} item', { slot: slotLabel });

  return (
    <Popover
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <PopoverTrigger
        render={
          <Button
            aria-label={buttonLabel}
            aria-pressed={selectedItem !== undefined}
            className={clsx(
              'relative',
              selectedItem === undefined && 'text-muted-foreground',
            )}
            data-tooltip-content={
              selectedItem === undefined
                ? buttonLabel
                : t(`ITEMS.${selectedItem.name}.NAME`)
            }
            data-tooltip-id="general-tooltip"
            size="icon"
            variant={selectedItem === undefined ? 'outline' : 'default'}
          >
            {icon}
          </Button>
        }
      />
      <PopoverContent
        align="end"
        className="w-72 p-2"
        initialFocus={false}
      >
        <div className="flex flex-col gap-2">
          <div className="px-1 text-sm font-medium">{slotLabel}</div>
          <div className="max-h-72 overflow-y-auto">
            <Button
              className={clsx(
                'mb-1 h-auto w-full justify-start px-2 py-1.5 text-left',
                selectedItem === undefined && 'bg-accent',
              )}
              variant="ghost"
              onClick={() => {
                onItemChange(slot);
                setIsOpen(false);
              }}
            >
              {t('No item')}
            </Button>
            {slotItems.map((item) => {
              const power = getHeroItemBonus(item, 'power');
              const damageReduction = getHeroItemBonus(item, 'damageReduction');

              return (
                <Button
                  key={item.id}
                  className={clsx(
                    'h-auto w-full justify-start gap-3 px-2 py-1.5 text-left',
                    selectedItemId === item.id && 'bg-accent',
                  )}
                  variant="ghost"
                  onClick={() => {
                    onItemChange(slot, item.id);
                    setIsOpen(false);
                  }}
                >
                  <span className="max-w-36 truncate">
                    {t(`ITEMS.${item.name}.NAME`)}
                  </span>
                  <span className="flex items-center gap-2 text-muted-foreground text-xs">
                    {power > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <GiFist className="size-3.5" />+{power}
                      </span>
                    )}
                    {damageReduction > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <GiShield className="size-3.5" />-{damageReduction}
                      </span>
                    )}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const CombatSimulatorHeroItemControls = ({
  heroStats,
  onHeroStatsChange,
}: {
  heroStats: CombatSimulatorHeroStats;
  onHeroStatsChange: (heroStats: CombatSimulatorHeroStats) => void;
}) => {
  const { t } = useTranslation();

  const handleItemChange = (
    slot: CombatSimulatorHeroItemSlot,
    itemId?: HeroItem['id'],
  ) => {
    const itemIdsBySlot = { ...heroStats.itemIdsBySlot };

    if (itemId === undefined) {
      delete itemIdsBySlot[slot];
    } else {
      itemIdsBySlot[slot] = itemId;
    }

    onHeroStatsChange({
      ...heroStats,
      itemIdsBySlot,
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <div
        className="flex items-center gap-1"
        data-tooltip-content={t('Hero items')}
        data-tooltip-id="general-tooltip"
      >
        {heroItemSlots.map(({ slot, icon }) => (
          <CombatSimulatorHeroItemSelector
            key={slot}
            icon={icon}
            selectedItemId={heroStats.itemIdsBySlot[slot]}
            slot={slot}
            onItemChange={handleItemChange}
          />
        ))}
      </div>
    </div>
  );
};

export const CombatSimulatorHeroStatsControlsRow = ({
  participantRole,
  troops,
  heroStats,
  onHeroStatsChange,
}: {
  participantRole: 'attacker' | 'defender';
  troops: CombatSimulatorTroop[];
  heroStats: CombatSimulatorHeroStats;
  onHeroStatsChange: (heroStats: CombatSimulatorHeroStats) => void;
}) => {
  const { t } = useTranslation();
  const heroTroop = troops.find(({ unitId }) => unitId === 'HERO');
  const isHeroIncluded = (heroTroop?.amount ?? 0) > 0;

  if (!isHeroIncluded) {
    return null;
  }

  const heroStatsLabel = t('Hero stats');
  const participantInputId = participantRole;

  const heroStatFields = [
    {
      key: 'hp',
      label: t('Health'),
      min: 1,
      max: 100,
      icon: <FaHeart className="size-4 md:size-5" />,
    },
    {
      key: 'strength',
      label: t('Strength points'),
      min: 0,
      max: 100,
      icon: <GiFist className="size-4 md:size-5" />,
    },
    participantRole === 'attacker'
      ? {
          key: 'attackBonus',
          label: t('Attack bonus points'),
          min: 0,
          max: 100,
          icon: (
            <Icon
              className="size-4 md:size-5"
              shouldShowTooltip={false}
              type="attack"
            />
          ),
        }
      : {
          key: 'defenceBonus',
          label: t('Defence bonus points'),
          min: 0,
          max: 100,
          icon: (
            <Icon
              className="size-4 md:size-5"
              shouldShowTooltip={false}
              type="defenceBonus"
            />
          ),
        },
  ] satisfies {
    key: keyof Pick<
      CombatSimulatorHeroStats,
      'hp' | 'strength' | 'attackBonus' | 'defenceBonus'
    >;
    label: string;
    min: number;
    max: number;
    icon: ReactNode;
  }[];

  return (
    <table className="w-full border-collapse border border-t-0 overflow-hidden dark:border-border text-left">
      <tbody>
        <tr>
          <td className="border-r dark:border-border p-1 w-6">
            <div
              className="flex justify-center"
              data-tooltip-content={heroStatsLabel}
              data-tooltip-id="general-tooltip"
            >
              <span className="sr-only">{heroStatsLabel}</span>
              <Icon
                className="size-4 md:size-5"
                type="hero"
              />
            </div>
          </td>
          <td className="p-1">
            <div className="flex flex-wrap items-center justify-between gap-8">
              <div className="flex flex-wrap items-center justify-end gap-2">
                {heroStatFields.map(({ key, label, min, max, icon }) => (
                  <label
                    key={key}
                    className="flex items-center gap-1 text-muted-foreground"
                    data-tooltip-content={label}
                    data-tooltip-id="general-tooltip"
                    htmlFor={`combat-simulator-${participantInputId}-hero-${key}`}
                  >
                    <span className="inline-flex items-center justify-center">
                      <span className="sr-only">{label}</span>
                      {icon}
                    </span>
                    <LevelInputPopover
                      className="px-1 w-8 text-center"
                      id={`combat-simulator-${participantInputId}-hero-${key}`}
                      inputSize="numericDoubleDigit"
                      label={label}
                      max={max}
                      min={min}
                      value={heroStats[key]}
                      onValueChange={(value) => {
                        onHeroStatsChange({
                          ...heroStats,
                          [key]: value,
                        });
                      }}
                    />
                  </label>
                ))}
                <label
                  className="flex items-center gap-2 text-muted-foreground"
                  data-tooltip-content={t('Mounted')}
                  data-tooltip-id="general-tooltip"
                  htmlFor={`combat-simulator-${participantInputId}-hero-mounted`}
                >
                  <span className="sr-only">{t('Mounted')}</span>
                  <GiHorseHead
                    aria-hidden="true"
                    className="size-4 md:size-5"
                  />
                  <Checkbox
                    checked={heroStats.mounted}
                    id={`combat-simulator-${participantInputId}-hero-mounted`}
                    onCheckedChange={(checked) => {
                      onHeroStatsChange({
                        ...heroStats,
                        mounted: checked,
                      });
                    }}
                  />
                </label>
              </div>
              <CombatSimulatorHeroItemControls
                heroStats={heroStats}
                onHeroStatsChange={onHeroStatsChange}
              />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
};
