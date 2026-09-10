import type { ReasonCode, RecommendationLabel, TradeoffCode } from '@shared/domain/recommendation';

/**
 * The engine only ever returns structured codes (see shared/domain/recommendation.ts).
 * This is the one place those codes become player-facing text.
 */
export const REASON_TEXT: Record<ReasonCode, string> = {
  FITS_CHAMPION_KIT: "Fits your champion's kit and scaling.",
  MATCHES_DAMAGE_PROFILE: 'Strongly matches your damage profile.',
  COUNTERS_ENEMY_PHYSICAL_DAMAGE: 'Several visible enemies deal mostly physical damage.',
  COUNTERS_ENEMY_MAGIC_DAMAGE: 'Several visible enemies deal mostly magic damage.',
  COUNTERS_ENEMY_HEALING: 'The enemy team has meaningful healing or sustain.',
  COUNTERS_ENEMY_SHIELDING: 'The enemy team relies on shielding.',
  COUNTERS_ENEMY_HARD_CC: 'The enemy team brings significant hard crowd control.',
  COUNTERS_ENEMY_BURST: 'The enemy team can burst you down quickly.',
  COUNTERS_ENEMY_TANKS: 'The enemy team has multiple durable targets.',
  FULLY_AFFORDABLE_NOW: 'You can buy it outright right now.',
  AFFORDABLE_COMPONENT_NOW: 'You can afford a component toward it now.',
  COMPLEMENTS_CURRENT_ITEMS: 'Complements your current items without overlap.',
  STRONG_IN_CURRENT_PHASE: 'Strong for this point in the game.',
  SMOOTH_BUILD_PATH: 'Has a smooth, forgiving build path.',
  FILLS_TEAM_UTILITY_GAP: "Fills a utility gap in your team's composition.",
};

export const TRADEOFF_TEXT: Record<TradeoffCode, string> = {
  DELAYS_DAMAGE_SPIKE: 'Delays your next damage power spike.',
  DELAYS_DEFENSIVE_SPIKE: 'Delays your next defensive power spike.',
  EXPENSIVE_RIGHT_NOW: "You're a fair amount of gold away from finishing it.",
  OVERLAPS_EXISTING_STATS: 'Overlaps with stats or effects you already have.',
  NARROW_BUILD_PATH: 'Its build path is awkward for your current gold.',
  LOWER_TEAM_UTILITY: "Offers less to your team's overall utility.",
  REACTIVE_ONLY_ITEM: "It's mainly reactive -- it counters threats rather than scaling your own kit.",
};

export const LABEL_TEXT: Record<RecommendationLabel, string> = {
  best_overall: 'Best overall',
  safer_defense: 'Safer defense',
  earlier_spike: 'Earlier power spike',
  higher_damage: 'Higher damage',
  team_utility: 'Team utility',
};
