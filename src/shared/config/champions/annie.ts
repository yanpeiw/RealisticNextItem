import type { ChampionProfile } from '../../domain/game-snapshot';

export const ANNIE: ChampionProfile = {
  championName: 'Annie',
  supportedRoles: ['MIDDLE'],
  damageProfile: { physical: 0.05, magic: 0.95, trueDamage: 0.05 },
  threatTags: ['BURST', 'HARD_CC'],
  desiredStatsByPhase: {
    EARLY: { abilityPower: 0.6, health: 0.3 },
    MID: { abilityPower: 0.7, abilityHaste: 0.3 },
    LATE: { abilityPower: 0.7, health: 0.4 },
  },
  itemCategoryPreferences: {
    MAGIC_DAMAGE: 0.9,
    ABILITY_HASTE: 0.4,
    HEALTH: 0.4,
    CROWD_CONTROL_UTILITY: 0.2,
  },
  excludedItemIds: [],
};
