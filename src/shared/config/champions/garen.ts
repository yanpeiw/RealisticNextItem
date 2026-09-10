import type { ChampionProfile } from '../../domain/game-snapshot';

export const GAREN: ChampionProfile = {
  championName: 'Garen',
  supportedRoles: ['TOP'],
  damageProfile: { physical: 0.85, magic: 0.15, trueDamage: 0.15 },
  threatTags: ['SUSTAINED', 'TANK'],
  desiredStatsByPhase: {
    EARLY: { armor: 0.6, health: 0.5, attackDamage: 0.4 },
    MID: { health: 0.6, armor: 0.5, attackDamage: 0.5 },
    LATE: { health: 0.7, armor: 0.4, attackDamage: 0.3 },
  },
  itemCategoryPreferences: {
    PHYSICAL_DAMAGE: 0.5,
    ARMOR: 0.9,
    HEALTH: 0.9,
    MAGIC_RESIST: 0.6,
    ANTI_HEAL: 0.3,
    ATTACK_SPEED: 0.2,
  },
  excludedItemIds: [],
};
