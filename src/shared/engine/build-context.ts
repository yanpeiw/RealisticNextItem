import type { ChampionProfile, GamePhase, GameSnapshot, ThreatTag } from '../domain/game-snapshot';
import { computeGamePhase } from '../domain/game-snapshot';
import type { StrategyPreference } from '../domain/recommendation';
import { GAME_PHASE_BOUNDARIES } from '../config/scoring';
import { getChampionProfile } from '../config/champions';

export type MatchContext = {
  phase: GamePhase;
  gameTimeSeconds: number;
  championProfile: ChampionProfile;
  currentGold: number;
  ownedItemIds: number[];
  allyProfiles: ChampionProfile[];
  allyOwnedItemIds: number[];
  enemyProfiles: ChampionProfile[];
  /** How many visible enemies carry each threat tag. */
  enemyThreatCounts: Record<ThreatTag, number>;
  enemyPhysicalShare: number;
  enemyMagicShare: number;
  strategy: StrategyPreference;
};

const EMPTY_THREAT_COUNTS: Record<ThreatTag, number> = {
  BURST: 0,
  SUSTAINED: 0,
  HEALING: 0,
  SHIELDING: 0,
  HARD_CC: 0,
  TANK: 0,
};

export function buildMatchContext(
  snapshot: GameSnapshot,
  strategy: StrategyPreference = 'BALANCED',
): MatchContext | undefined {
  const championProfile = getChampionProfile(snapshot.activePlayer.championName);
  if (!championProfile) return undefined;

  const enemyProfiles = snapshot.enemies
    .map((enemy) => getChampionProfile(enemy.championName))
    .filter((profile): profile is ChampionProfile => Boolean(profile));
  const allyProfiles = snapshot.allies
    .map((ally) => getChampionProfile(ally.championName))
    .filter((profile): profile is ChampionProfile => Boolean(profile));

  const enemyThreatCounts: Record<ThreatTag, number> = { ...EMPTY_THREAT_COUNTS };
  let physicalTotal = 0;
  let magicTotal = 0;
  for (const enemy of enemyProfiles) {
    for (const tag of enemy.threatTags) {
      enemyThreatCounts[tag] += 1;
    }
    physicalTotal += enemy.damageProfile.physical;
    magicTotal += enemy.damageProfile.magic;
  }
  const damageTotal = physicalTotal + magicTotal || 1;

  return {
    phase: computeGamePhase(snapshot.gameTimeSeconds, GAME_PHASE_BOUNDARIES),
    gameTimeSeconds: snapshot.gameTimeSeconds,
    championProfile,
    currentGold: snapshot.activePlayer.currentGold ?? 0,
    ownedItemIds: [...snapshot.activePlayer.itemIds],
    allyProfiles,
    allyOwnedItemIds: snapshot.allies.flatMap((ally) => ally.itemIds),
    enemyProfiles,
    enemyThreatCounts,
    enemyPhysicalShare: physicalTotal / damageTotal,
    enemyMagicShare: magicTotal / damageTotal,
    strategy,
  };
}

export function gamePhaseOf(gameTimeSeconds: number): GamePhase {
  return computeGamePhase(gameTimeSeconds, GAME_PHASE_BOUNDARIES);
}
