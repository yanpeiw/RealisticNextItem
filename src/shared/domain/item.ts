export type ItemCategory =
  | 'PHYSICAL_DAMAGE'
  | 'MAGIC_DAMAGE'
  | 'ARMOR'
  | 'MAGIC_RESIST'
  | 'ANTI_HEAL'
  | 'HEALTH'
  | 'ATTACK_SPEED'
  | 'ABILITY_HASTE'
  | 'CROWD_CONTROL_UTILITY'
  | 'TEAM_UTILITY'
  | 'MOVEMENT'
  | 'MANA';

export type ItemStats = {
  attackDamage?: number;
  abilityPower?: number;
  armor?: number;
  magicResist?: number;
  health?: number;
  attackSpeedPercent?: number;
  abilityHaste?: number;
  criticalChancePercent?: number;
};

/**
 * Normalized, scoring-friendly view of a Data Dragon item plus curated
 * overrides. This is the shape the pure engine consumes -- it never sees
 * raw Data Dragon JSON.
 */
export type CatalogItem = {
  id: number;
  name: string;
  totalPrice: number;
  purchasable: boolean;
  availableOnSummonersRift: boolean;
  categories: ItemCategory[];
  stats: ItemStats;
  buildsFrom: number[];
  /** Group key: only one item per group may be owned/recommended at a time. */
  mutuallyExclusiveGroup?: string;
  /** True if the item's passive/aura is a non-stacking unique effect. */
  hasUniqueEffect: boolean;
  /** Tags this item counters, matched against enemy ChampionProfile.threatTags. */
  countersThreatTags: import('./game-snapshot').ThreatTag[];
  /** Phase this item is strongest in, for game-phase-value scoring. */
  bestPhases: Array<'EARLY' | 'MID' | 'LATE'>;
  iconId: string;
};
