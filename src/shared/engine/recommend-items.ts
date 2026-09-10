import type { GameSnapshot } from '../domain/game-snapshot';
import type { CatalogItem } from '../domain/item';
import type {
  ItemRecommendation,
  RecommendationSet,
  StrategyPreference,
} from '../domain/recommendation';
import { buildMatchContext, type MatchContext } from './build-context';
import { scoreItem, type ScoredCandidate } from './score-item';
import { explainReasons, explainTradeoffs } from './explain';
import { DIVERSITY_PENALTY } from '../config/scoring';
import { stableHash } from '../utils/hash';

type StrategicCategory = 'DEFENSE' | 'DAMAGE' | 'UTILITY' | 'NEUTRAL';

const DEFENSIVE_CATEGORIES = new Set(['ARMOR', 'MAGIC_RESIST', 'HEALTH']);
const DAMAGE_CATEGORIES = new Set(['PHYSICAL_DAMAGE', 'MAGIC_DAMAGE']);

/**
 * The pure recommendation engine entry point. No Electron, React, Zustand,
 * filesystem, network, or window APIs may be imported from this module or
 * anything it imports -- see LOL_ITEM_ADVISOR_BRAIN.md section 11.
 *
 * Deterministic: the same snapshot, catalog, strategy, and `now` always
 * produce the same RecommendationSet, and none of the arguments are mutated.
 */
export function recommendItems(
  snapshot: GameSnapshot,
  catalog: readonly CatalogItem[],
  strategy: StrategyPreference = 'BALANCED',
  now: number = Date.now(),
): RecommendationSet {
  const snapshotHash = hashSnapshot(snapshot);
  const context = buildMatchContext(snapshot, strategy);

  if (!context) {
    return {
      status: 'unsupported_champion',
      snapshotHash,
      generatedAt: now,
      championName: snapshot.activePlayer.championName,
    };
  }

  const candidates = catalog
    .map((item) => scoreItem(item, context))
    .filter((candidate): candidate is ScoredCandidate => Boolean(candidate))
    .sort((a, b) => b.score - a.score);

  if (candidates.length < 3) {
    return { status: 'no_valid_candidates', snapshotHash, generatedAt: now };
  }

  const primary = candidates[0]!;
  const alternatives = pickDiverseAlternatives(primary, candidates.slice(1));

  return {
    status: 'ok',
    snapshotHash,
    generatedAt: now,
    primary: toRecommendation(primary, context, 'best_overall'),
    alternatives: [
      toRecommendation(alternatives[0], context, labelFor(alternatives[0])),
      toRecommendation(alternatives[1], context, labelFor(alternatives[1])),
    ],
  };
}

function pickDiverseAlternatives(
  primary: ScoredCandidate,
  remaining: ScoredCandidate[],
): [ScoredCandidate, ScoredCandidate] {
  const primaryCategory = strategicCategory(primary);

  const first = bestByAdjustedScore(remaining, [primaryCategory]);
  const usedCategories = [primaryCategory, strategicCategory(first)];
  const second = bestByAdjustedScore(
    remaining.filter((c) => c.item.id !== first.item.id),
    usedCategories,
  );

  return [first, second];
}

function bestByAdjustedScore(
  pool: ScoredCandidate[],
  penalizedCategories: StrategicCategory[],
): ScoredCandidate {
  let best = pool[0]!;
  let bestAdjusted = -Infinity;
  for (const candidate of pool) {
    const category = strategicCategory(candidate);
    const penalty = penalizedCategories.includes(category) ? DIVERSITY_PENALTY : 0;
    const adjusted = candidate.score - penalty;
    if (adjusted > bestAdjusted) {
      bestAdjusted = adjusted;
      best = candidate;
    }
  }
  return best;
}

function strategicCategory(candidate: ScoredCandidate): StrategicCategory {
  const categories = candidate.item.categories;
  if (categories.includes('TEAM_UTILITY')) return 'UTILITY';
  const hasDamage = categories.some((c) => DAMAGE_CATEGORIES.has(c));
  const hasDefense = categories.some((c) => DEFENSIVE_CATEGORIES.has(c));
  if (hasDamage && !hasDefense) return 'DAMAGE';
  if (hasDefense && !hasDamage) return 'DEFENSE';
  return 'NEUTRAL';
}

function labelFor(candidate: ScoredCandidate): ItemRecommendation['label'] {
  switch (strategicCategory(candidate)) {
    case 'DEFENSE':
      return 'safer_defense';
    case 'UTILITY':
      return 'team_utility';
    case 'DAMAGE':
      return candidate.goldNeeded === 0 ? 'earlier_spike' : 'higher_damage';
    default:
      return candidate.goldNeeded === 0 ? 'earlier_spike' : 'higher_damage';
  }
}

function toRecommendation(
  candidate: ScoredCandidate,
  context: MatchContext,
  label: ItemRecommendation['label'],
): ItemRecommendation {
  return {
    itemId: candidate.item.id,
    score: candidate.score,
    label,
    reasons: explainReasons(candidate, context),
    tradeoffs: explainTradeoffs(candidate, context),
    goldNeeded: candidate.goldNeeded,
    componentPath: [...candidate.item.buildsFrom],
    factorScores: { ...candidate.factorScores },
  };
}

function hashSnapshot(snapshot: GameSnapshot): string {
  return stableHash({
    gameTimeSeconds: snapshot.gameTimeSeconds,
    activePlayer: {
      championName: snapshot.activePlayer.championName,
      currentGold: snapshot.activePlayer.currentGold,
      itemIds: [...snapshot.activePlayer.itemIds].sort(),
    },
    allies: snapshot.allies.map((a) => ({ championName: a.championName, itemIds: [...a.itemIds].sort() })),
    enemies: snapshot.enemies.map((e) => ({ championName: e.championName, itemIds: [...e.itemIds].sort() })),
  });
}
