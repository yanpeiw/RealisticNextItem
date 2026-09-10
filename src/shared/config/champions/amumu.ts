import type { ChampionProfile } from '../../domain/game-snapshot';

export const AMUMU: ChampionProfile = {
  championName: 'Amumu',
  supportedRoles: ['JUNGLE'],
  damageProfile: { physical: 0.1, magic: 0.85, trueDamage: 0.1 },
  threatTags: ['HARD_CC', 'TANK', 'BURST'],
  desiredStatsByPhase: {
    EARLY: { health: 0.6, armor: 0.4, magicResist: 0.4 },
    MID: { health: 0.7, abilityPower: 0.3, armor: 0.4, magicResist: 0.4 },
    LATE: { health: 0.8, abilityPower: 0.3 },
  },
  itemCategoryPreferences: {
    HEALTH: 0.9,
    ARMOR: 0.6,
    MAGIC_RESIST: 0.6,
    MAGIC_DAMAGE: 0.4,
    TEAM_UTILITY: 0.4,
    ABILITY_HASTE: 0.3,
  },
  excludedItemIds: [],
};
