import type { ChampionProfile } from '../../domain/game-snapshot';

export const WARWICK: ChampionProfile = {
  championName: 'Warwick',
  supportedRoles: ['JUNGLE'],
  damageProfile: { physical: 0.75, magic: 0.25, trueDamage: 0.1 },
  threatTags: ['SUSTAINED', 'HEALING'],
  desiredStatsByPhase: {
    EARLY: { attackDamage: 0.5, health: 0.4, armor: 0.3 },
    MID: { health: 0.6, attackDamage: 0.5, abilityHaste: 0.3 },
    LATE: { health: 0.7, attackDamage: 0.4 },
  },
  itemCategoryPreferences: {
    PHYSICAL_DAMAGE: 0.6,
    HEALTH: 0.8,
    ARMOR: 0.5,
    MAGIC_RESIST: 0.5,
    ABILITY_HASTE: 0.3,
  },
  excludedItemIds: [],
};
