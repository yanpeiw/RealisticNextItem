import type { CatalogItem, ItemStats } from '../domain/item';
import type { ScoringFactor } from '../domain/recommendation';
import type { StrategyPreference } from '../domain/recommendation';
import type { MatchContext } from './build-context';
import { FACTOR_WEIGHTS, PENALTIES, THREAT_SIGNIFICANCE_THRESHOLD } from '../config/scoring';
import { findCatalogItem } from '../config/items';

export type PenaltyCode =
  | 'WASTED_STAT_MISMATCH'
  | 'REDUNDANT_UNIQUE_EFFECT'
  | 'POOR_BUILD_PATH'
  | 'CONFLICTS_WITH_STRATEGY';

export type ScoredCandidate = {
  item: CatalogItem;
  score: number;
  factorScores: Record<ScoringFactor, number>;
  appliedPenalties: PenaltyCode[];
  goldNeeded: number;
};

const DEFENSIVE_CATEGORIES = new Set(['ARMOR', 'MAGIC_RESIST', 'HEALTH']);
const DAMAGE_CATEGORIES = new Set(['PHYSICAL_DAMAGE', 'MAGIC_DAMAGE']);

/**
 * Returns undefined when the candidate must be excluded outright (not a
 * purchasable Summoner's Rift item, already owned and non-stackable,
 * mutually exclusive with something owned, or excluded by the champion
 * profile). Otherwise returns the fully scored candidate.
 *
 * Pure function: never mutates `item` or `context`.
 */
export function scoreItem(item: CatalogItem, context: MatchContext): ScoredCandidate | undefined {
  if (!isCandidateEligible(item, context)) return undefined;

  const factorScores: Record<ScoringFactor, number> = {
    CHAMPION_FIT: scoreChampionFit(item, context),
    ENEMY_COUNTER_VALUE: scoreEnemyCounterValue(item, context),
    AFFORDABILITY: scoreAffordability(item, context),
    INVENTORY_SYNERGY: scoreInventorySynergy(item, context),
    GAME_PHASE_VALUE: scoreGamePhaseValue(item, context),
    BUILD_PATH_QUALITY: scoreBuildPathQuality(item, context),
    TEAM_UTILITY: scoreTeamUtility(item, context),
  };

  const baseScore = Object.values(factorScores).reduce((sum, value) => sum + value, 0);
  const { total: penalizedScore, applied } = applyPenalties(baseScore, item, context, factorScores);

  return {
    item,
    score: Math.max(0, Math.round(penalizedScore * 100) / 100),
    factorScores,
    appliedPenalties: applied,
    goldNeeded: Math.max(0, item.totalPrice - context.currentGold),
  };
}

function isCandidateEligible(item: CatalogItem, context: MatchContext): boolean {
  if (!item.purchasable || !item.availableOnSummonersRift) return false;
  if (context.championProfile.excludedItemIds.includes(item.id)) return false;
  if (context.ownedItemIds.includes(item.id)) return false;
  if (item.mutuallyExclusiveGroup) {
    const ownsConflicting = context.ownedItemIds.some((ownedId) => {
      if (ownedId === item.id) return false;
      const owned = findCatalogItem(ownedId);
      return owned?.mutuallyExclusiveGroup === item.mutuallyExclusiveGroup;
    });
    if (ownsConflicting) return false;
  }
  return true;
}

function scoreChampionFit(item: CatalogItem, context: MatchContext): number {
  const preferences = context.championProfile.itemCategoryPreferences;
  const categoryWeights = item.categories.map((category) => preferences[category] ?? 0);
  const categoryScore = categoryWeights.length
    ? categoryWeights.reduce((sum, weight) => sum + weight, 0) / categoryWeights.length
    : 0;

  const desiredStats = context.championProfile.desiredStatsByPhase[context.phase];
  const statKeys = (Object.keys(item.stats) as Array<keyof ItemStats>).filter(
    (key) => (item.stats[key] ?? 0) > 0,
  );
  const statWeights = statKeys.map((key) => desiredStats[key] ?? 0);
  const statScore = statWeights.length
    ? statWeights.reduce((sum, weight) => sum + weight, 0) / statWeights.length
    : 0;

  const fitRatio = clamp01(categoryScore * 0.6 + statScore * 0.4);
  return fitRatio * FACTOR_WEIGHTS.CHAMPION_FIT;
}

function scoreEnemyCounterValue(item: CatalogItem, context: MatchContext): number {
  let ratio = 0;

  if (item.categories.includes('ARMOR')) {
    ratio += context.enemyPhysicalShare * 0.5;
  }
  if (item.categories.includes('MAGIC_RESIST')) {
    ratio += context.enemyMagicShare * 0.5;
  }

  if (item.countersThreatTags.length > 0) {
    const tagContribution =
      item.countersThreatTags.reduce((sum, tag) => {
        const count = context.enemyThreatCounts[tag];
        return sum + Math.min(count / THREAT_SIGNIFICANCE_THRESHOLD, 1);
      }, 0) / item.countersThreatTags.length;
    ratio += tagContribution * 0.6;
  }

  return clamp01(ratio) * FACTOR_WEIGHTS.ENEMY_COUNTER_VALUE;
}

function scoreAffordability(item: CatalogItem, context: MatchContext): number {
  if (context.currentGold >= item.totalPrice) {
    return FACTOR_WEIGHTS.AFFORDABILITY;
  }
  const ratio = clamp01(context.currentGold / item.totalPrice);
  return ratio * 0.7 * FACTOR_WEIGHTS.AFFORDABILITY;
}

function scoreInventorySynergy(item: CatalogItem, context: MatchContext): number {
  const ownedCategoryCounts = new Map<string, number>();
  for (const ownedId of context.ownedItemIds) {
    const owned = findCatalogItem(ownedId);
    if (!owned) continue;
    for (const category of owned.categories) {
      ownedCategoryCounts.set(category, (ownedCategoryCounts.get(category) ?? 0) + 1);
    }
  }

  if (item.categories.length === 0) return FACTOR_WEIGHTS.INVENTORY_SYNERGY;

  const redundantHits = item.categories.filter(
    (category) => (ownedCategoryCounts.get(category) ?? 0) >= 2,
  ).length;
  const synergyRatio = clamp01(1 - redundantHits / item.categories.length);
  return synergyRatio * FACTOR_WEIGHTS.INVENTORY_SYNERGY;
}

function scoreGamePhaseValue(item: CatalogItem, context: MatchContext): number {
  if (item.bestPhases.includes(context.phase)) {
    return FACTOR_WEIGHTS.GAME_PHASE_VALUE;
  }
  const adjacency: Record<string, string[]> = {
    EARLY: ['MID'],
    MID: ['EARLY', 'LATE'],
    LATE: ['MID'],
  };
  const isAdjacent = item.bestPhases.some((phase) => adjacency[context.phase]?.includes(phase));
  return (isAdjacent ? 0.5 : 0.2) * FACTOR_WEIGHTS.GAME_PHASE_VALUE;
}

function approximateComponentPrice(item: CatalogItem): number {
  const componentCount = Math.max(item.buildsFrom.length, 1);
  return item.totalPrice / (componentCount + 1);
}

function scoreBuildPathQuality(item: CatalogItem, context: MatchContext): number {
  const componentCount = item.buildsFrom.length;
  const smoothness = componentCount <= 2 ? 1 : 0.6;

  const canAffordFull = context.currentGold >= item.totalPrice;
  const canAffordComponent = context.currentGold >= approximateComponentPrice(item);
  const affordabilityBonus = canAffordFull || canAffordComponent ? 1 : 0.3;

  return clamp01(smoothness * 0.5 + affordabilityBonus * 0.5) * FACTOR_WEIGHTS.BUILD_PATH_QUALITY;
}

function scoreTeamUtility(item: CatalogItem, context: MatchContext): number {
  if (!item.categories.includes('TEAM_UTILITY')) return 0;
  const allyAlreadyHasUtility = context.allyOwnedItemIds.some((id) => {
    const owned = findCatalogItem(id);
    return owned?.categories.includes('TEAM_UTILITY');
  });
  return (allyAlreadyHasUtility ? 0.4 : 1) * FACTOR_WEIGHTS.TEAM_UTILITY;
}

function applyPenalties(
  baseScore: number,
  item: CatalogItem,
  context: MatchContext,
  factorScores: Record<ScoringFactor, number>,
): { total: number; applied: PenaltyCode[] } {
  let total = baseScore;
  const applied: PenaltyCode[] = [];

  const fitRatio = factorScores.CHAMPION_FIT / FACTOR_WEIGHTS.CHAMPION_FIT;
  const counterRatio = factorScores.ENEMY_COUNTER_VALUE / FACTOR_WEIGHTS.ENEMY_COUNTER_VALUE;
  if (fitRatio < 0.15 && counterRatio < 0.15) {
    total -= PENALTIES.WASTED_STAT_MISMATCH;
    applied.push('WASTED_STAT_MISMATCH');
  }

  if (item.hasUniqueEffect && item.categories.includes('ANTI_HEAL')) {
    const ownsAntiHeal = context.ownedItemIds.some((id) => {
      const owned = findCatalogItem(id);
      return owned?.categories.includes('ANTI_HEAL');
    });
    if (ownsAntiHeal) {
      total -= PENALTIES.REDUNDANT_UNIQUE_EFFECT;
      applied.push('REDUNDANT_UNIQUE_EFFECT');
    }
  }

  const buildPathRatio = factorScores.BUILD_PATH_QUALITY / FACTOR_WEIGHTS.BUILD_PATH_QUALITY;
  if (context.currentGold < item.totalPrice * 0.15 && buildPathRatio < 0.4) {
    total -= PENALTIES.POOR_BUILD_PATH;
    applied.push('POOR_BUILD_PATH');
  }

  if (conflictsWithStrategy(item, context.strategy)) {
    total -= PENALTIES.CONFLICTS_WITH_STRATEGY;
    applied.push('CONFLICTS_WITH_STRATEGY');
  }

  return { total, applied };
}

function conflictsWithStrategy(item: CatalogItem, strategy: StrategyPreference): boolean {
  const isPurelyOffensive =
    item.categories.some((c) => DAMAGE_CATEGORIES.has(c)) &&
    !item.categories.some((c) => DEFENSIVE_CATEGORIES.has(c));
  const isPurelyDefensive =
    item.categories.some((c) => DEFENSIVE_CATEGORIES.has(c)) &&
    !item.categories.some((c) => DAMAGE_CATEGORIES.has(c));

  if (strategy === 'SAFER' && isPurelyOffensive) return true;
  if (strategy === 'AGGRESSIVE' && isPurelyDefensive) return true;
  return false;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
