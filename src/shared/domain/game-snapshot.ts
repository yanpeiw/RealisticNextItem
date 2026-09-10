export type Team = 'ORDER' | 'CHAOS';
export type Role = 'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOTTOM' | 'UTILITY';
export type GamePhase = 'EARLY' | 'MID' | 'LATE';

export type PlayerStats = {
  attackDamage?: number;
  abilityPower?: number;
  armor?: number;
  magicResist?: number;
  maxHealth?: number;
};

export type PlayerSnapshot = {
  championName: string;
  team: Team;
  role?: Role;
  level: number;
  currentGold?: number;
  itemIds: number[];
  stats?: PlayerStats;
};

export type GameSnapshot = {
  capturedAt: number;
  gameTimeSeconds: number;
  gameMode: string;
  mapNumber: number;
  activePlayer: PlayerSnapshot;
  allies: PlayerSnapshot[];
  enemies: PlayerSnapshot[];
};

export type ThreatTag =
  | 'BURST'
  | 'SUSTAINED'
  | 'HEALING'
  | 'SHIELDING'
  | 'HARD_CC'
  | 'TANK';

export type ChampionProfile = {
  championName: string;
  supportedRoles: Role[];
  damageProfile: {
    physical: number;
    magic: number;
    trueDamage: number;
  };
  threatTags: ThreatTag[];
  desiredStatsByPhase: Record<GamePhase, Record<string, number>>;
  itemCategoryPreferences: Record<string, number>;
  excludedItemIds: number[];
};

export function computeGamePhase(gameTimeSeconds: number, boundaries: { earlyEndsAt: number; midEndsAt: number }): GamePhase {
  const minutes = gameTimeSeconds / 60;
  if (minutes < boundaries.earlyEndsAt) return 'EARLY';
  if (minutes < boundaries.midEndsAt) return 'MID';
  return 'LATE';
}
