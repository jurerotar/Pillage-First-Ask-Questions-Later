import { heroFactory } from 'app/factories/hero-factory';
import { egyptianServerMock, gaulServerMock, hunServerMock, romanServerMock, teutonServerMock } from 'mocks/game/server-mock';

export const gaulHero = heroFactory(gaulServerMock);
export const teutonHero = heroFactory(teutonServerMock);
export const romanHero = heroFactory(romanServerMock);
export const egyptianHero = heroFactory(egyptianServerMock);
export const hunHero = heroFactory(hunServerMock);
