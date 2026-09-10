import type { ChampionProfile } from '../../domain/game-snapshot';

export const LUX: ChampionProfile = {
  championName: 'Lux',
  supportedRoles: ['UTILITY', 'MIDDLE'],
  damageProfile: { physical: 0.05, magic: 0.95, trueDamage: 0.05 },
  threatTags: ['BURST', 'SHIELDING'],
  desiredStatsByPhase: {
    EARLY: { abilityPower: 0.5, health: 0.3 },
    MID: { abilityPower: 0.6, abilityHaste: 0.3 },
    LATE: { abilityPower: 0.6, health: 0.4 },
  },
  itemCategoryPreferences: {
    MAGIC_DAMAGE: 0.7,
    TEAM_UTILITY: 0.5,
    ABILITY_HASTE: 0.3,
    HEALTH: 0.3,
  },
  excludedItemIds: [],
};
