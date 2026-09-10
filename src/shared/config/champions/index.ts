import type { ChampionProfile } from '../../domain/game-snapshot';
import { GAREN } from './garen';
import { DARIUS } from './darius';
import { WARWICK } from './warwick';
import { AMUMU } from './amumu';
import { AHRI } from './ahri';
import { ANNIE } from './annie';
import { JINX } from './jinx';
import { ASHE } from './ashe';
import { LEONA } from './leona';
import { LUX } from './lux';

/**
 * The MVP's supported roster (see LOL_ITEM_ADVISOR_BRAIN.md section 8).
 * Adding a champion is a matter of adding a profile here -- the scoring
 * engine itself never changes.
 */
export const CHAMPION_PROFILES: Record<string, ChampionProfile> = {
  Garen: GAREN,
  Darius: DARIUS,
  Warwick: WARWICK,
  Amumu: AMUMU,
  Ahri: AHRI,
  Annie: ANNIE,
  Jinx: JINX,
  Ashe: ASHE,
  Leona: LEONA,
  Lux: LUX,
};

export function getChampionProfile(championName: string): ChampionProfile | undefined {
  return CHAMPION_PROFILES[championName];
}

export function isChampionSupported(championName: string): boolean {
  return championName in CHAMPION_PROFILES;
}
