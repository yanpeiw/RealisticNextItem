import type { ChampionProfile } from '../../domain/game-snapshot';

export const LEONA: ChampionProfile = {
  championName: 'Leona',
  supportedRoles: ['UTILITY'],
  damageProfile: { physical: 0.1, magic: 0.6, trueDamage: 0.3 },
  threatTags: ['HARD_CC', 'TANK'],
  desiredStatsByPhase: {
    EARLY: { health: 0.5, armor: 0.4, magicResist: 0.4 },
    MID: { health: 0.7, armor: 0.5, magicResist: 0.5 },
    LATE: { health: 0.8, armor: 0.4, magicResist: 0.4 },
  },
  itemCategoryPreferences: {
    HEALTH: 0.9,
    ARMOR: 0.6,
    MAGIC_RESIST: 0.6,
    TEAM_UTILITY: 0.7,
    CROWD_CONTROL_UTILITY: 0.3,
  },
  excludedItemIds: [],
};
