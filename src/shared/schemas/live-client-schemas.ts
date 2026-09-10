import { z } from 'zod';

/**
 * Schemas for the three required Live Client Data API endpoints
 * (see LOL_ITEM_ADVISOR_BRAIN.md section 7.1). Every field the engine
 * doesn't need is dropped during normalization, not just left unvalidated.
 */

export const GameStatsSchema = z.object({
  gameMode: z.string(),
  gameTime: z.number(),
  mapName: z.string(),
  mapNumber: z.number(),
  mapTerrain: z.string().optional(),
});
export type GameStatsResponse = z.infer<typeof GameStatsSchema>;

export const ActivePlayerSchema = z.object({
  currentGold: z.number(),
  level: z.number(),
  summonerName: z.string(),
  championStats: z
    .object({
      attackDamage: z.number().optional(),
      abilityPower: z.number().optional(),
      armor: z.number().optional(),
      magicResist: z.number().optional(),
      maxHealth: z.number().optional(),
    })
    .partial()
    .optional(),
});
export type ActivePlayerResponse = z.infer<typeof ActivePlayerSchema>;

const PlayerItemSchema = z.object({
  itemID: z.number(),
});

const PlayerListEntrySchema = z.object({
  championName: z.string(),
  team: z.enum(['ORDER', 'CHAOS']),
  level: z.number(),
  items: z.array(PlayerItemSchema).default([]),
  position: z.string().optional(),
  isDead: z.boolean().optional(),
  /**
   * Used transiently to split allies/enemies from the active player's own
   * row. Never copied into PlayerSnapshot -- see game-snapshot.ts, which has
   * no identity field, and section 12's "do not persist" rule.
   */
  summonerName: z.string(),
});

export const PlayerListSchema = z.array(PlayerListEntrySchema);
export type PlayerListResponse = z.infer<typeof PlayerListSchema>;

const ROLE_BY_POSITION: Record<string, 'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOTTOM' | 'UTILITY'> = {
  TOP: 'TOP',
  JUNGLE: 'JUNGLE',
  MIDDLE: 'MIDDLE',
  BOTTOM: 'BOTTOM',
  UTILITY: 'UTILITY',
};

export type LiveClientPoll = {
  gameStats: GameStatsResponse;
  activePlayer: ActivePlayerResponse;
  playerList: PlayerListResponse;
};

/**
 * Combines a validated poll of the three endpoints into the shared
 * GameSnapshot domain type. This is the ONLY place that translates raw
 * Riot response shapes into the model the recommendation engine consumes.
 */
export function normalizeLiveClientPoll(
  poll: LiveClientPoll,
  capturedAt: number,
): import('../domain/game-snapshot').GameSnapshot {
  const toPlayerSnapshot = (
    entry: PlayerListResponse[number],
    overrides: { currentGold?: number; stats?: ActivePlayerResponse['championStats'] } = {},
  ) => ({
    championName: entry.championName,
    team: entry.team,
    role: entry.position ? ROLE_BY_POSITION[entry.position.toUpperCase()] : undefined,
    level: entry.level,
    currentGold: overrides.currentGold,
    itemIds: entry.items.map((item) => item.itemID),
    stats: overrides.stats,
  });

  // The active player's own row in playerlist is matched by summoner name
  // so we can split allies/enemies from a single poll.
  const active = poll.playerList.find(
    (entry) => entry.summonerName === poll.activePlayer.summonerName,
  );
  if (!active) {
    throw new Error('Live client poll did not contain the active player in playerlist');
  }
  const activeTeam = active.team;

  const allies = poll.playerList.filter((entry) => entry.team === activeTeam && entry !== active);
  const enemies = poll.playerList.filter((entry) => entry.team !== activeTeam);

  return {
    capturedAt,
    gameTimeSeconds: poll.gameStats.gameTime,
    gameMode: poll.gameStats.gameMode,
    mapNumber: poll.gameStats.mapNumber,
    activePlayer: toPlayerSnapshot(active, {
      currentGold: poll.activePlayer.currentGold,
      stats: poll.activePlayer.championStats,
    }),
    allies: allies.map((entry) => toPlayerSnapshot(entry)),
    enemies: enemies.map((entry) => toPlayerSnapshot(entry)),
  };
}
