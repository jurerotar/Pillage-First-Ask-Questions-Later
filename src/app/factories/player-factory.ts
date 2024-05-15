import { Server } from 'interfaces/models/game/server';
import { Player, PlayerFaction } from 'interfaces/models/game/player';
import { Tribe } from 'interfaces/models/game/tribe';
import { seededRandomArrayElement } from 'app/utils/common';

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

const getName = (tribe: Tribe, seed: string): string => {
  switch (tribe) {
    case 'romans': {
      return `${seededRandomArrayElement(seed, romanFirstNames)} ${seededRandomArrayElement(seed, romanSecondNames)}`;
    }
    case 'teutons': {
      return `${seededRandomArrayElement(seed, teutonFirstNames)} ${seededRandomArrayElement(seed, teutonSecondNames)}`;
    }
    case 'gauls': {
      return seededRandomArrayElement(seed, gaulNames);
    }
    case 'huns': {
      return seededRandomArrayElement(seed, hunNames);
    }
    case 'egyptians': {
      return seededRandomArrayElement(seed, egyptiansNames);
    }
    case 'spartans': {
      return seededRandomArrayElement(seed, spartansNames);
    }
    default: {
      return 'Missing name';
    }
  }
};

type PlayerFactoryProps = {
  server: Server;
  faction: PlayerFaction;
  index: number;
};

export const playerFactory = ({ server, faction, index }: PlayerFactoryProps): Player => {
  const seed = `${server.id}-${index}`;
  // Spartans are not enabled yet, because we're missing data
  const tribe = seededRandomArrayElement<Tribe>(seed, ['romans', 'gauls', 'teutons', 'egyptians', 'huns']);

  return {
    id: crypto.randomUUID(),
    serverId: server.id,
    name: getName(tribe, seed),
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
