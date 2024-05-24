import { seededRandomArrayElement } from 'app/utils/common';
import type { Player, PlayerFaction } from 'interfaces/models/game/player';
import type { Server } from 'interfaces/models/game/server';
import type { Tribe } from 'interfaces/models/game/tribe';
import type { PRNGFunction } from 'interfaces/libs/esm-seedrandom';

const romanFirstNames = ['Acacius', 'Fulgentius', 'Faustus', 'Kaius', 'Anastius', 'Anthea', 'Iantha', 'Ligea', 'Athena', 'Circe'];

const romanSecondNames = [
  'Hispallus',
  'Murena',
  'Salvitto',
  'Priscus',
  'Agelastus',
  'Regillensis',
  'Scapula',
  'Octavianus',
  'Volusus',
  'Augur',
];

const teutonFirstNames = ['Aldwin', 'Gilbert', 'Arda', 'Arnulf', 'Hubert', 'Hartwin', 'Ermenrich', 'Herman', 'Egilhard', 'Ferdinand'];

const teutonSecondNames = ['Drechslerg', 'Fryee', 'Forstg', 'Bluee', 'Grafg', 'Bradleye', 'Fairburne', 'Beutelg', 'Gerverg', 'Brauerl'];

const gaulNames = [
  'Aneirin',
  'Bran',
  'Caddock',
  'Cassius',
  'Darian',
  'Emeric',
  'Gildas',
  'Lir',
  'Niall',
  'Owain',
  'Peredur',
  'Quintus',
  'Rhys',
  'Séamus',
  'Taliesin',
  'Urien',
  'Xanthus',
  'Yannick',
  'Zephyr',
  'Vercingetorix',
];

const hunNames = [
  'Altan',
  'Batbayar',
  'Bayarmaa',
  'Bayarjargal',
  'Bolor',
  'Chinggis',
  'Delger',
  'Enkhjin',
  'Erdene',
  'Gantulga',
  'Gerel',
  'Jargal',
  'Khaliun',
  'Khulan',
  'Naran',
  'Nergui',
  'Nergui',
  'Nyamjargal',
  'Oyunbileg',
  'Purev',
];

const egyptiansNames = [
  'Menkaura',
  'Baketmut',
  'Sobekhotep',
  'Kemet',
  'Nebetnehat',
  'Renenutet',
  'Sneferu',
  'Hapy',
  'Neferkare',
  'Amunhotep',
  'Seshat',
  'Meryt',
  'Tuya',
  'Khaemweset',
  'Nubia',
  'Nakht',
  'Renpet',
  'Amenemhat',
  'Ankhesenamun',
  'Tuthmosis',
];

const spartansNames = [
  'Spartaclus',
  'Cleombrotus',
  'Agesilaus',
  'Eudamidas',
  'Agis',
  'Leonidas',
  'Lysander',
  'Astacos',
  'Lichas',
  'Thucydides',
  'Damaratus',
  'Hipparchus',
  'Eudamidas',
  'Clearchus',
  'Pleistoanax',
  'Xenares',
  'Eucleidas',
  'Areus',
  'Cleomenes',
  'Archidamus',
];

const getName = (tribe: Tribe, prng: PRNGFunction): string => {
  switch (tribe) {
    case 'romans': {
      return `${seededRandomArrayElement(prng, romanFirstNames)} ${seededRandomArrayElement(prng, romanSecondNames)}`;
    }
    case 'teutons': {
      return `${seededRandomArrayElement(prng, teutonFirstNames)} ${seededRandomArrayElement(prng, teutonSecondNames)}`;
    }
    case 'gauls': {
      return seededRandomArrayElement(prng, gaulNames);
    }
    case 'huns': {
      return seededRandomArrayElement(prng, hunNames);
    }
    case 'egyptians': {
      return seededRandomArrayElement(prng, egyptiansNames);
    }
    case 'spartans': {
      return seededRandomArrayElement(prng, spartansNames);
    }
    default: {
      return 'Missing name';
    }
  }
};

type PlayerFactoryProps = {
  server: Server;
  faction: PlayerFaction;
  prng: PRNGFunction;
};

export const playerFactory = ({ server, faction, prng }: PlayerFactoryProps): Player => {
  const tribe = seededRandomArrayElement<Tribe>(prng, ['romans', 'gauls', 'teutons', 'egyptians', 'huns']);

  return {
    id: crypto.randomUUID(),
    serverId: server.id,
    name: getName(tribe, prng),
    tribe,
    faction,
  };
};

type UserPlayerFactoryProps = {
  server: Server;
};

export const userPlayerFactory = ({ server }: UserPlayerFactoryProps): Player => {
  const {
    name,
    playerConfiguration: { tribe },
  } = server;
  return {
    id: crypto.randomUUID(),
    serverId: server.id,
    name,
    tribe,
    faction: 'player',
  };
};
