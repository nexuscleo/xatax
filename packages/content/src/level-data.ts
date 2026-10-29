import world1Json from './levels/world1.json';
import world2Json from './levels/world2.json';
import world3Json from './levels/world3.json';
import { LevelDataSchema } from './level';
import type { LevelData } from './level';

const world1 = LevelDataSchema.parse(world1Json);
const world2 = LevelDataSchema.parse(world2Json);
const world3 = LevelDataSchema.parse(world3Json);

export const levels: Readonly<Record<string, LevelData>> = Object.freeze({
  [world1.id]: world1,
  [world2.id]: world2,
  [world3.id]: world3,
});
