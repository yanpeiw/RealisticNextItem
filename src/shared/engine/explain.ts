import type { ScoringFactor, ReasonCode, TradeoffCode } from '../domain/recommendation';
import type { MatchContext } from './build-context';
import type { ScoredCandidate } from './score-item';
import { FACTOR_WEIGHTS, THREAT_SIGNIFICANCE_THRESHOLD } from '../config/scoring';

const DEFENSIVE_CATEGORIES = new Set(['ARMOR', 'MAGIC_RESIST', 'HEALTH']);
const DAMAGE_CATEGORIES = new Set(['PHYSICAL_DAMAGE', 'MAGIC_DAMAGE']);

/**
 * Turns a scored candidate's raw factor scores into structured reason codes,
 * sorted by contribution, most important first. The renderer maps these
 * codes to player-facing text -- this module never produces prose.
 */
export function explainReasons(candidate: ScoredCandidate, context: MatchContext): ReasonCode[] {
  const contributingFactors = (Object.entries(candidate.factorScores) as Array<
    [ScoringFactor, number]
  >)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);

  const codes: ReasonCode[] = [];
  for (const [factor] of contributingFactors) {
    const code = reasonCodeForFactor(factor, candidate, context);
    if (code && !codes.includes(code)) codes.push(code);
    if (codes.length === 2) break;
  }

  return codes.length > 0 ? codes : ['FITS_CHAMPION_KIT'];
}

function reasonCodeForFactor(
  factor: ScoringFactor,
  candidate: ScoredCandidate,
  context: MatchContext,
): ReasonCode | undefined {
  const { item } = candidate;
  switch (factor) {
    case 'CHAMPION_FIT':
      return candidate.factorScores.CHAMPION_FIT / FACTOR_WEIGHTS.CHAMPION_FIT > 0.6
        ? 'MATCHES_DAMAGE_PROFILE'
        : 'FITS_CHAMPION_KIT';
    case 'ENEMY_COUNTER_VALUE':
      return enemyCounterReason(item, context);
    case 'AFFORDABILITY':
      return candidate.factorScores.AFFORDABILITY >= FACTOR_WEIGHTS.AFFORDABILITY
        ? 'FULLY_AFFORDABLE_NOW'
        : 'AFFORDABLE_COMPONENT_NOW';
    case 'INVENTORY_SYNERGY':
      return 'COMPLEMENTS_CURRENT_ITEMS';
    case 'GAME_PHASE_VALUE':
      return 'STRONG_IN_CURRENT_PHASE';
    case 'BUILD_PATH_QUALITY':
      return 'SMOOTH_BUILD_PATH';
    case 'TEAM_UTILITY':
      return 'FILLS_TEAM_UTILITY_GAP';
    default:
      return undefined;
  }
}

function enemyCounterReason(
  item: ScoredCandidate['item'],
  context: MatchContext,
): ReasonCode | undefined {
  const rankedTags = item.countersThreatTags
    .map((tag) => ({ tag, count: context.enemyThreatCounts[tag] }))
    .sort((a, b) => b.count - a.count);

  const topTag = rankedTags.find((entry) => entry.count >= THREAT_SIGNIFICANCE_THRESHOLD)?.tag;
  switch (topTag) {
    case 'HEALING':
    case 'SUSTAINED':
      return 'COUNTERS_ENEMY_HEALING';
    case 'SHIELDING':
      return 'COUNTERS_ENEMY_SHIELDING';
    case 'HARD_CC':
      return 'COUNTERS_ENEMY_HARD_CC';
    case 'BURST':
      return 'COUNTERS_ENEMY_BURST';
    case 'TANK':
      return 'COUNTERS_ENEMY_TANKS';
    default:
      break;
  }

  if (item.categories.includes('ARMOR') && context.enemyPhysicalShare >= 0.5) {
    return 'COUNTERS_ENEMY_PHYSICAL_DAMAGE';
  }
  if (item.categories.includes('MAGIC_RESIST') && context.enemyMagicShare >= 0.5) {
    return 'COUNTERS_ENEMY_MAGIC_DAMAGE';
  }
  return undefined;
}

export function explainTradeoffs(candidate: ScoredCandidate, context: MatchContext): TradeoffCode[] {
  const { item } = candidate;

  if (
    candidate.appliedPenalties.includes('REDUNDANT_UNIQUE_EFFECT') ||
    candidate.appliedPenalties.includes('WASTED_STAT_MISMATCH')
  ) {
    return ['OVERLAPS_EXISTING_STATS'];
  }

  if (candidate.goldNeeded > 0 && candidate.goldNeeded >= item.totalPrice * 0.3) {
    return ['EXPENSIVE_RIGHT_NOW'];
  }

  const isPurelyDefensive =
    item.categories.some((c) => DEFENSIVE_CATEGORIES.has(c)) &&
    !item.categories.some((c) => DAMAGE_CATEGORIES.has(c));
  if (isPurelyDefensive) {
    return ['DELAYS_DAMAGE_SPIKE'];
  }

  const isPurelyOffensive =
    item.categories.some((c) => DAMAGE_CATEGORIES.has(c)) &&
    !item.categories.some((c) => DEFENSIVE_CATEGORIES.has(c));
  const facesSignificantThreat = Object.values(context.enemyThreatCounts).some(
    (count) => count >= THREAT_SIGNIFICANCE_THRESHOLD,
  );
  if (isPurelyOffensive && facesSignificantThreat) {
    return ['DELAYS_DEFENSIVE_SPIKE'];
  }

  const buildPathRatio = candidate.factorScores.BUILD_PATH_QUALITY / FACTOR_WEIGHTS.BUILD_PATH_QUALITY;
  if (buildPathRatio < 0.4) {
    return ['NARROW_BUILD_PATH'];
  }

  if (item.countersThreatTags.length > 0 && candidate.factorScores.CHAMPION_FIT / FACTOR_WEIGHTS.CHAMPION_FIT < 0.3) {
    return ['REACTIVE_ONLY_ITEM'];
  }

  if (context.championProfile.supportedRoles.includes('UTILITY') && !item.categories.includes('TEAM_UTILITY')) {
    return ['LOWER_TEAM_UTILITY'];
  }

  return isPurelyOffensive ? ['DELAYS_DEFENSIVE_SPIKE'] : ['DELAYS_DAMAGE_SPIKE'];
}
