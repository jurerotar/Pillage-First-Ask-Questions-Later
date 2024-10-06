import type { PRNGFunction } from 'app/interfaces/libs/esm-seedrandom';
import type { Player, PlayerFaction } from 'app/interfaces/models/game/player';
import type { Server } from 'app/interfaces/models/game/server';
import type { PlayableTribe } from 'app/interfaces/models/game/tribe';
import { seededRandomArrayElement } from 'app/utils/common';
// @ts-ignore
import { prng_alea } from 'esm-seedrandom';

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

// const spartansNames = [
//   'Spartaclus',
//   'Cleombrotus',
//   'Agesilaus',
//   'Eudamidas',
//   'Agis',
//   'Leonidas',
//   'Lysander',
//   'Astacos',
//   'Lichas',
//   'Thucydides',
//   'Damaratus',
//   'Hipparchus',
//   'Eudamidas',
//   'Clearchus',
//   'Pleistoanax',
//   'Xenares',
//   'Eucleidas',
//   'Areus',
//   'Cleomenes',
//   'Archidamus',
// ];

const getName = (tribe: PlayableTribe, prng: PRNGFunction): string => {
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
    // case 'spartans': {
    //   return seededRandomArrayElement(prng, spartansNames);
    // }
    default: {
      return 'Missing name';
    }
  }
};

type PlayerFactoryProps = {
  faction: PlayerFaction;
  prng: PRNGFunction;
};

const playerFactory = ({ faction, prng }: PlayerFactoryProps): Player => {
  const tribe = seededRandomArrayElement<PlayableTribe>(prng, ['romans', 'gauls', 'teutons', 'egyptians', 'huns']);

  return {
    id: crypto.randomUUID(),
    name: getName(tribe, prng),
    tribe,
    faction,
  };
};

type UserPlayerFactoryProps = {
  server: Server;
};

const userPlayerFactory = ({ server }: UserPlayerFactoryProps): Player => {
  const {
    name,
    playerConfiguration: { tribe },
  } = server;
  return {
    id: crypto.randomUUID(),
    name,
    tribe,
    faction: 'player',
  };
};

export const generatePlayers = (server: Server, factions: PlayerFaction[], playerCount: number) => {
  const prng = prng_alea(server.seed);

  const userPlayer = userPlayerFactory({ server });
  const npcPlayers = [...Array(playerCount)].map(() => {
    const faction = seededRandomArrayElement<PlayerFaction>(prng, factions);
    return playerFactory({ faction, prng });
  });

  return {
    userPlayer,
    npcPlayers,
    players: [userPlayer, ...npcPlayers],
  };
};
