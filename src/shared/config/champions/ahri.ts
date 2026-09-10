import type { ChampionProfile } from '../../domain/game-snapshot';

export const AHRI: ChampionProfile = {
  championName: 'Ahri',
  supportedRoles: ['MIDDLE'],
  damageProfile: { physical: 0.05, magic: 0.95, trueDamage: 0.05 },
  threatTags: ['BURST'],
  desiredStatsByPhase: {
    EARLY: { abilityPower: 0.5, abilityHaste: 0.3 },
    MID: { abilityPower: 0.7, abilityHaste: 0.3 },
    LATE: { abilityPower: 0.7, health: 0.3 },
  },
  itemCategoryPreferences: {
    MAGIC_DAMAGE: 0.9,
    ABILITY_HASTE: 0.4,
    HEALTH: 0.3,
    MAGIC_RESIST: 0.2,
  },
  excludedItemIds: [],
};
