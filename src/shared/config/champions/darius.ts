import type { ChampionProfile } from '../../domain/game-snapshot';

export const DARIUS: ChampionProfile = {
  championName: 'Darius',
  supportedRoles: ['TOP'],
  damageProfile: { physical: 0.9, magic: 0.1, trueDamage: 0.3 },
  threatTags: ['BURST', 'SUSTAINED'],
  desiredStatsByPhase: {
    EARLY: { attackDamage: 0.6, armor: 0.4, health: 0.3 },
    MID: { attackDamage: 0.6, health: 0.5, armor: 0.3 },
    LATE: { attackDamage: 0.5, health: 0.6 },
  },
  itemCategoryPreferences: {
    PHYSICAL_DAMAGE: 0.9,
    HEALTH: 0.7,
    ARMOR: 0.5,
    ATTACK_SPEED: 0.3,
    ANTI_HEAL: 0.2,
  },
  excludedItemIds: [],
};
