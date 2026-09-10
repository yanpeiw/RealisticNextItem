export type ScoringFactor =
  | 'CHAMPION_FIT'
  | 'ENEMY_COUNTER_VALUE'
  | 'AFFORDABILITY'
  | 'INVENTORY_SYNERGY'
  | 'GAME_PHASE_VALUE'
  | 'BUILD_PATH_QUALITY'
  | 'TEAM_UTILITY';

export type ReasonCode =
  | 'FITS_CHAMPION_KIT'
  | 'MATCHES_DAMAGE_PROFILE'
  | 'COUNTERS_ENEMY_PHYSICAL_DAMAGE'
  | 'COUNTERS_ENEMY_MAGIC_DAMAGE'
  | 'COUNTERS_ENEMY_HEALING'
  | 'COUNTERS_ENEMY_SHIELDING'
  | 'COUNTERS_ENEMY_HARD_CC'
  | 'COUNTERS_ENEMY_BURST'
  | 'COUNTERS_ENEMY_TANKS'
  | 'FULLY_AFFORDABLE_NOW'
  | 'AFFORDABLE_COMPONENT_NOW'
  | 'COMPLEMENTS_CURRENT_ITEMS'
  | 'STRONG_IN_CURRENT_PHASE'
  | 'SMOOTH_BUILD_PATH'
  | 'FILLS_TEAM_UTILITY_GAP';

export type TradeoffCode =
  | 'DELAYS_DAMAGE_SPIKE'
  | 'DELAYS_DEFENSIVE_SPIKE'
  | 'EXPENSIVE_RIGHT_NOW'
  | 'OVERLAPS_EXISTING_STATS'
  | 'NARROW_BUILD_PATH'
  | 'LOWER_TEAM_UTILITY'
  | 'REACTIVE_ONLY_ITEM';

export type RecommendationLabel =
  | 'best_overall'
  | 'safer_defense'
  | 'earlier_spike'
  | 'higher_damage'
  | 'team_utility';

export type ItemRecommendation = {
  itemId: number;
  score: number;
  label: RecommendationLabel;
  reasons: ReasonCode[];
  tradeoffs: TradeoffCode[];
  goldNeeded: number;
  componentPath: number[];
  factorScores: Record<ScoringFactor, number>;
};

export type RecommendationSet =
  | {
      status: 'ok';
      snapshotHash: string;
      generatedAt: number;
      primary: ItemRecommendation;
      alternatives: [ItemRecommendation, ItemRecommendation];
    }
  | {
      status: 'unsupported_champion';
      snapshotHash: string;
      generatedAt: number;
      championName: string;
    }
  | {
      status: 'no_valid_candidates';
      snapshotHash: string;
      generatedAt: number;
    };

export type StrategyPreference = 'BALANCED' | 'SAFER' | 'AGGRESSIVE';
