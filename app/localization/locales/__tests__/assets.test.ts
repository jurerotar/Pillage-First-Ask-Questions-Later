import { describe, expect, test } from 'vitest';
import { icons } from 'app/components/icons/icons';
import enUSAssets from '../en-US/assets.json' with { type: 'json' };

const locales = [{ locale: 'en-US', data: enUSAssets }];

describe('Localization completeness check for assets.json', () => {
  locales.forEach(({ locale, data }) => {
    describe(`Locale: ${locale}`, () => {
      test('UNITS should have NAME, NAME_other and DESCRIPTION set', () => {
        for (const [unitKey, unitData] of Object.entries(data.UNITS)) {
          expect(
            Object.hasOwn(unitData, 'NAME'),
            `Missing NAME in UNITS.${unitKey}`,
          ).toBe(true);
          expect(
            Object.hasOwn(unitData, 'NAME_other'),
            `Missing NAME_other in UNITS.${unitKey}`,
          ).toBe(true);
          expect(
            Object.hasOwn(unitData, 'DESCRIPTION'),
            `Missing DESCRIPTION in UNITS.${unitKey}`,
          ).toBe(true);

          expect(unitData.NAME, `UNITS.${unitKey}.NAME is empty`).not.toBe('');
          expect(
            unitData.NAME_other,
            `UNITS.${unitKey}.NAME_other is empty`,
          ).not.toEqual('');
          expect(
            unitData.DESCRIPTION,
            `UNITS.${unitKey}.DESCRIPTION is empty`,
          ).not.toEqual('');
        }
      });

      test('BUILDINGS should have NAME, NAME_other and DESCRIPTION set', () => {
        for (const [buildingKey, buildingData] of Object.entries(
          data.BUILDINGS,
        )) {
          expect(
            Object.hasOwn(buildingData, 'NAME'),
            `Missing NAME in BUILDINGS.${buildingKey}`,
          ).toBe(true);
          expect(
            Object.hasOwn(buildingData, 'NAME_other'),
            `Missing NAME_other in BUILDINGS.${buildingKey}`,
          ).toBe(true);
          expect(
            Object.hasOwn(buildingData, 'DESCRIPTION'),
            `Missing DESCRIPTION in BUILDINGS.${buildingKey}`,
          ).toBe(true);

          expect(
            buildingData.NAME,
            `BUILDINGS.${buildingKey}.NAME is empty`,
          ).not.toEqual('');
          expect(
            buildingData.NAME_other,
            `BUILDINGS.${buildingKey}.NAME_other is empty`,
          ).not.toEqual('');
          expect(
            buildingData.DESCRIPTION,
            `BUILDINGS.${buildingKey}.DESCRIPTION is empty`,
          ).not.toEqual('');
        }
      });

      test('ITEMS should have NAME, NAME_other and DESCRIPTION set', () => {
        for (const [itemKey, itemData] of Object.entries(data.ITEMS)) {
          expect(
            Object.hasOwn(itemData, 'NAME'),
            `Missing NAME in ITEMS.${itemKey}`,
          ).toBe(true);
          expect(
            Object.hasOwn(itemData, 'NAME_other'),
            `Missing NAME_other in ITEMS.${itemKey}`,
          ).toBe(true);
          expect(
            Object.hasOwn(itemData, 'DESCRIPTION'),
            `Missing DESCRIPTION in ITEMS.${itemKey}`,
          ).toBe(true);
          expect(itemData.NAME, `ITEMS.${itemKey}.NAME is empty`).not.toEqual(
            '',
          );
          expect(
            itemData.NAME_other,
            `ITEMS.${itemKey}.NAME_other is empty`,
          ).not.toEqual('');
          // TODO: Fill in the DESCRIPTION fields
          // expect(itemData.NAME, `ITEMS.${itemKey}.DESCRIPTION is empty`).not.toEqual('');
        }
      });

      test('ICONS should have a localization for all icons in typeToIconMap', () => {
        const effectLocalizations = data.ICONS;

        for (const iconKey of Object.keys(icons)) {
          // @ts-expect-error: Not sure if we care about this one
          const value = effectLocalizations?.[iconKey];

          expect(value, `Missing ICONS key: ${iconKey}`).toBeDefined();
          expect(value, `ICONS.${iconKey} is empty`).not.toEqual('');
        }
      });
    });
  });
});
