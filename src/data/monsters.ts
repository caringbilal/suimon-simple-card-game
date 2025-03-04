import sui from '../assets/monsters/sui.png';
import grum from '../assets/monsters/grum.png';
import stomp from '../assets/monsters/stomp.png';
import blaze from '../assets/monsters/blaze.png';
import brocco from '../assets/monsters/brocco.png';
import yeti from '../assets/monsters/yeti.png';
import nubb from '../assets/monsters/nubb.png';
import nom from '../assets/monsters/nom.png';
import cyclo from '../assets/monsters/cyclo.png';
import glint from '../assets/monsters/glint.png';
import fluff from '../assets/monsters/fluff.png';
import captainboo from '../assets/monsters/captainboo.png';
import momo from '../assets/monsters/momo.png';
import slippy from '../assets/monsters/slippy.png';
import whirl from '../assets/monsters/whirl.png';
import twispy from '../assets/monsters/twispy.png';
import pico from '../assets/monsters/pico.png';
import tuga from '../assets/monsters/tuga.png';
import kai from '../assets/monsters/kai.png';
import ruk from '../assets/monsters/ruk.png';
import pyro from '../assets/monsters/pyro.png';
import grow from '../assets/monsters/grow.png';
import luna from '../assets/monsters/luna.png';
import floar from '../assets/monsters/floar.png';
import ecron from '../assets/monsters/ecron.png';

export const monsterCards = [
  { id: 'sui-1', name: 'Sui', attack: 50, defense: 30, hp: 100, maxHp: 100, imageUrl: sui },
  { id: 'grum-1', name: 'Grum', attack: 60, defense: 40, hp: 90, maxHp: 90, imageUrl: grum },
  { id: 'stomp-1', name: 'Stomp', attack: 70, defense: 50, hp: 80, maxHp: 80, imageUrl: stomp },
  { id: 'blaze-1', name: 'Blaze', attack: 80, defense: 30, hp: 70, maxHp: 70, imageUrl: blaze },
  { id: 'brocco-1', name: 'Brocco', attack: 40, defense: 70, hp: 110, maxHp: 110, imageUrl: brocco },
  { id: 'yeti-1', name: 'Yeti', attack: 65, defense: 65, hp: 100, maxHp: 100, imageUrl: yeti },
  { id: 'nubb-1', name: 'Nubb', attack: 45, defense: 45, hp: 120, maxHp: 120, imageUrl: nubb },
  { id: 'nom-1', name: 'Nom', attack: 55, defense: 35, hp: 90, maxHp: 90, imageUrl: nom },
  { id: 'cyclo-1', name: 'Cyclo', attack: 75, defense: 45, hp: 85, maxHp: 85, imageUrl: cyclo },
  { id: 'glint-1', name: 'Glint', attack: 70, defense: 40, hp: 80, maxHp: 80, imageUrl: glint },
  { id: 'fluff-1', name: 'Fluff', attack: 35, defense: 75, hp: 100, maxHp: 100, imageUrl: fluff },
  { id: 'captainboo-1', name: 'Captain Boo', attack: 85, defense: 55, hp: 95, maxHp: 95, imageUrl: captainboo },
  { id: 'momo-1', name: 'Momo', attack: 50, defense: 50, hp: 100, maxHp: 100, imageUrl: momo },
  { id: 'slippy-1', name: 'Slippy', attack: 45, defense: 65, hp: 95, maxHp: 95, imageUrl: slippy },
  { id: 'whirl-1', name: 'Whirl', attack: 60, defense: 60, hp: 90, maxHp: 90, imageUrl: whirl },
  { id: 'twispy-1', name: 'Twispy', attack: 55, defense: 55, hp: 100, maxHp: 100, imageUrl: twispy },
  { id: 'pico-1', name: 'Pico', attack: 40, defense: 40, hp: 130, maxHp: 130, imageUrl: pico },
  { id: 'tuga-1', name: 'Tuga', attack: 30, defense: 80, hp: 120, maxHp: 120, imageUrl: tuga },
  { id: 'kai-1', name: 'Kai', attack: 65, defense: 45, hp: 90, maxHp: 90, imageUrl: kai },
  { id: 'ruk-1', name: 'Ruk', attack: 75, defense: 35, hp: 85, maxHp: 85, imageUrl: ruk },
  { id: 'pyro-1', name: 'Pyro', attack: 80, defense: 40, hp: 75, maxHp: 75, imageUrl: pyro },
  { id: 'grow-1', name: 'Grow', attack: 45, defense: 70, hp: 105, maxHp: 105, imageUrl: grow },
  { id: 'luna-1', name: 'Luna', attack: 70, defense: 50, hp: 95, maxHp: 95, imageUrl: luna },
  { id: 'floar-1', name: 'Floar', attack: 55, defense: 60, hp: 100, maxHp: 100, imageUrl: floar },
  { id: 'ecron-1', name: 'Ecron', attack: 90, defense: 30, hp: 70, maxHp: 70, imageUrl: ecron }
];

export const getInitialHand = (count: number = 4) => {
  const shuffled = [...monsterCards].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};