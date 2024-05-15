import { heroFactory } from 'app/factories/hero-factory';
import {
  egyptianServerMock,
  gaulServerMock,
  hunServerMock,
  romanServerMock,
  serverMock,
  spartanServerMock,
  teutonServerMock,
} from 'mocks/models/game/server-mock';

describe('Hero factory', () => {
  const hero = heroFactory({ server: serverMock });

  test('Has correct server id', () => {
    expect(hero.serverId).toBe(serverMock.id);
  });

  describe('Static attributes', () => {
    const gaulHero = heroFactory({ server: gaulServerMock });
    const teutonHero = heroFactory({ server: teutonServerMock });
    const romanHero = heroFactory({ server: romanServerMock });
    const egyptianHero = heroFactory({ server: egyptianServerMock });
    const hunHero = heroFactory({ server: hunServerMock });
    const spartanHero = heroFactory({ server: spartanServerMock });

    describe('Unmounted speed', () => {
      test('Gaul hero', () => {
        expect(gaulHero.staticAttributes.unmountedSpeed).toBe(7);
      });
      test('Teuton hero', () => {
        expect(teutonHero.staticAttributes.unmountedSpeed).toBe(7);
      });
      test('Roman hero', () => {
        expect(romanHero.staticAttributes.unmountedSpeed).toBe(7);
      });
      test('Egyptian hero', () => {
        expect(egyptianHero.staticAttributes.unmountedSpeed).toBe(7);
      });
      test('Hun hero', () => {
        expect(hunHero.staticAttributes.unmountedSpeed).toBe(7);
      });
      test('Spartan hero', () => {
        expect(spartanHero.staticAttributes.unmountedSpeed).toBe(7);
      });
    });

    describe('Mounted speed', () => {
      test('Gaul hero', () => {
        expect(gaulHero.staticAttributes.mountedSpeed).toBe(19);
      });
      test('Teuton hero', () => {
        expect(teutonHero.staticAttributes.mountedSpeed).toBe(14);
      });
      test('Roman hero', () => {
        expect(romanHero.staticAttributes.mountedSpeed).toBe(14);
      });
      test('Egyptian hero', () => {
        expect(egyptianHero.staticAttributes.mountedSpeed).toBe(14);
      });
      test('Hun hero', () => {
        expect(hunHero.staticAttributes.mountedSpeed).toBe(14);
      });
      test('Spartan hero', () => {
        expect(spartanHero.staticAttributes.mountedSpeed).toBe(14);
      });
    });

    describe('Base attack power', () => {
      test('Gaul hero', () => {
        expect(gaulHero.staticAttributes.baseAttackPower).toBe(80);
      });
      test('Teuton hero', () => {
        expect(teutonHero.staticAttributes.baseAttackPower).toBe(80);
      });
      test('Roman hero', () => {
        expect(romanHero.staticAttributes.baseAttackPower).toBe(100);
      });
      test('Egyptian hero', () => {
        expect(egyptianHero.staticAttributes.baseAttackPower).toBe(80);
      });
      test('Hun hero', () => {
        expect(hunHero.staticAttributes.baseAttackPower).toBe(80);
      });
      test('Spartan hero', () => {
        expect(spartanHero.staticAttributes.baseAttackPower).toBe(80);
      });
    });

    describe('Base health regeneration rate', () => {
      test('Gaul hero', () => {
        expect(gaulHero.staticAttributes.baseHealthRegenerationRate).toBe(10);
      });
      test('Teuton hero', () => {
        expect(teutonHero.staticAttributes.baseHealthRegenerationRate).toBe(20);
      });
      test('Roman hero', () => {
        expect(romanHero.staticAttributes.baseHealthRegenerationRate).toBe(10);
      });
      test('Egyptian hero', () => {
        expect(egyptianHero.staticAttributes.baseHealthRegenerationRate).toBe(10);
      });
      test('Hun hero', () => {
        expect(hunHero.staticAttributes.baseHealthRegenerationRate).toBe(10);
      });
      test('Spartan hero', () => {
        expect(spartanHero.staticAttributes.baseHealthRegenerationRate).toBe(10);
      });
    });

    describe('Resource production', () => {
      test('Gaul hero', () => {
        expect(gaulHero.staticAttributes.resourceProduction).toBe(18);
      });
      test('Teuton hero', () => {
        expect(teutonHero.staticAttributes.resourceProduction).toBe(18);
      });
      test('Roman hero', () => {
        expect(romanHero.staticAttributes.resourceProduction).toBe(18);
      });
      test('Egyptian hero', () => {
        expect(egyptianHero.staticAttributes.resourceProduction).toBe(36);
      });
      test('Hun hero', () => {
        expect(hunHero.staticAttributes.resourceProduction).toBe(18);
      });
      test('Spartan hero', () => {
        expect(spartanHero.staticAttributes.resourceProduction).toBe(18);
      });
    });

    describe('Infantry troop speed bonus', () => {
      test('Gaul hero', () => {
        expect(gaulHero.staticAttributes.infantryTroopSpeedBonus).toBe(0);
      });
      test('Teuton hero', () => {
        expect(teutonHero.staticAttributes.infantryTroopSpeedBonus).toBe(0);
      });
      test('Roman hero', () => {
        expect(romanHero.staticAttributes.infantryTroopSpeedBonus).toBe(0);
      });
      test('Egyptian hero', () => {
        expect(egyptianHero.staticAttributes.infantryTroopSpeedBonus).toBe(0);
      });
      test('Hun hero', () => {
        expect(hunHero.staticAttributes.infantryTroopSpeedBonus).toBe(0);
      });
      test('Spartan hero', () => {
        expect(spartanHero.staticAttributes.infantryTroopSpeedBonus).toBe(5);
      });
    });

    describe('Mounted troop speed bonus', () => {
      test('Gaul hero', () => {
        expect(gaulHero.staticAttributes.mountedTroopSpeedBonus).toBe(0);
      });
      test('Teuton hero', () => {
        expect(teutonHero.staticAttributes.mountedTroopSpeedBonus).toBe(0);
      });
      test('Roman hero', () => {
        expect(romanHero.staticAttributes.mountedTroopSpeedBonus).toBe(0);
      });
      test('Egyptian hero', () => {
        expect(egyptianHero.staticAttributes.mountedTroopSpeedBonus).toBe(0);
      });
      test('Hun hero', () => {
        expect(hunHero.staticAttributes.mountedTroopSpeedBonus).toBe(3);
      });
      test('Spartan hero', () => {
        expect(spartanHero.staticAttributes.mountedTroopSpeedBonus).toBe(0);
      });
    });
  });
});
