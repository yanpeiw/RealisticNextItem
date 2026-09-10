import type { ChampionProfile } from '../../domain/game-snapshot';

export const ASHE: ChampionProfile = {
  championName: 'Ashe',
  supportedRoles: ['BOTTOM'],
  damageProfile: { physical: 0.85, magic: 0.15, trueDamage: 0.05 },
  threatTags: ['SUSTAINED', 'HARD_CC'],
  desiredStatsByPhase: {
    EARLY: { attackDamage: 0.5, criticalChancePercent: 0.3 },
    MID: { attackDamage: 0.6, criticalChancePercent: 0.5 },
    LATE: { attackDamage: 0.6, criticalChancePercent: 0.6 },
  },
  itemCategoryPreferences: {
    PHYSICAL_DAMAGE: 0.85,
    ATTACK_SPEED: 0.4,
    TEAM_UTILITY: 0.2,
    HEALTH: 0.2,
  },
  excludedItemIds: [],
};
