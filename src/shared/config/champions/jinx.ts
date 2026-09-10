import type { ChampionProfile } from '../../domain/game-snapshot';

export const JINX: ChampionProfile = {
  championName: 'Jinx',
  supportedRoles: ['BOTTOM'],
  damageProfile: { physical: 0.9, magic: 0.1, trueDamage: 0.05 },
  threatTags: ['SUSTAINED', 'BURST'],
  desiredStatsByPhase: {
    EARLY: { attackDamage: 0.5, attackSpeedPercent: 0.4 },
    MID: { attackDamage: 0.6, criticalChancePercent: 0.5, attackSpeedPercent: 0.4 },
    LATE: { attackDamage: 0.6, criticalChancePercent: 0.6 },
  },
  itemCategoryPreferences: {
    PHYSICAL_DAMAGE: 0.9,
    ATTACK_SPEED: 0.6,
    HEALTH: 0.2,
    ARMOR: 0.1,
  },
  excludedItemIds: [],
};
