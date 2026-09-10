import type { ScoringFactor } from '../domain/recommendation';

export const FACTOR_WEIGHTS: Record<ScoringFactor, number> = {
  CHAMPION_FIT: 30,
  ENEMY_COUNTER_VALUE: 25,
  AFFORDABILITY: 15,
  INVENTORY_SYNERGY: 10,
  GAME_PHASE_VALUE: 10,
  BUILD_PATH_QUALITY: 5,
  TEAM_UTILITY: 5,
};

export const PENALTIES = {
  WASTED_STAT_MISMATCH: 25,
  REDUNDANT_UNIQUE_EFFECT: 20,
  POOR_BUILD_PATH: 10,
  CONFLICTS_WITH_STRATEGY: 10,
};

export const GAME_PHASE_BOUNDARIES = {
  /** Minutes below this are EARLY. */
  earlyEndsAt: 14,
  /** Minutes below this (and >= earlyEndsAt) are MID; at/after is LATE. */
  midEndsAt: 28,
};

/** Enemy team threat is considered "significant" at or above this headcount. */
export const THREAT_SIGNIFICANCE_THRESHOLD = 2;

/** Minimum score (out of 100 before penalties) a candidate needs to be considered valid. */
export const MINIMUM_VIABLE_SCORE = 15;

/** Score subtracted from a recommendation whose strategic category duplicates
 * one already chosen, so alternatives stay meaningfully different. */
export const DIVERSITY_PENALTY = 12;
